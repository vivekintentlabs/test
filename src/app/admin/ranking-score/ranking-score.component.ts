import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Utils } from '../../common/utils';
import { CriterionType, PageLeaveReason } from '../../common/enums';
import { Constants } from '../../common/constants';
import { FormUtils } from '../../common/form-utils';
import { T } from 'app/common/t';

import { RankingScore } from '../../entities/ranking-score';
import { Criterium } from '../../entities/criterium';
import { ListItem } from '../../entities/list-item';
import { UserInfo } from '../../entities/userInfo';

import { HttpService } from '../../services/http.service';

import * as _ from 'lodash';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
    selector: 'data-table-ranking-score',
    templateUrl: 'ranking-score.component.html',
    styleUrls: ['./ranking-score.component.scss']
})
export class RankingScoreComponent implements OnInit, OnDestroy {

    public rankingScores: RankingScore[] = [];
    public criteria: Criterium[] = [];
    public lists: ListItem[] = [];
    public listItemRules: ListItem[] = [];
    public enumRules: object[] = [];
    public editingRankingScore: RankingScore = null;
    public rankingScoreForm: FormGroup;
    public showNew: boolean = Constants.showNew; // show constant string in html
    public noItemSelected = Constants.noItemSelected; // show constant string in html
    public maxScore: number;
    public isGreen: boolean;
    public pristine = true;
    private submitted = false;
    public countId = 0;
    public userInfo: UserInfo = null;

    promiseForBtn: Promise<any>;

    constructor(private fb: FormBuilder, private httpService: HttpService, private ref: ChangeDetectorRef) { }

    ngOnInit() {
        this.userInfo = Utils.getUserInfoFromToken();
        this.getData();
    }

    private getData(): Promise<void> {
        return this.httpService.getAuth('ranking-score').then((res: any) => {
            this.rankingScores = res.rankingScore;
            this.criteria = res.criteria;
            _.remove(this.criteria, c => c.id === 7);
            this.lists = res.list;
            _(this.rankingScores).forEach((rankingScore: RankingScore) => {
                rankingScore.isDeleted = false;
                rankingScore.isGreen = false;
                rankingScore.criteriaName = (rankingScore.criteriumId === null) ? T.unknown : rankingScore.criterium.name;
            });
            this.prepareScreen();
            this.calculateScore();
            this.rankingScores = _.orderBy(this.rankingScores, ['criteriaName', 'score'], ['asc', 'desc']);
            return Promise.resolve();
        });
    }

    private createRankingScoreForm() {
        const formJSON = {
            enabled: [this.editingRankingScore.enabled],
            criteriumId: [this.editingRankingScore.criteriumId, Validators.required],
            listItemId: [this.editingRankingScore.listItemId],
            enumValue: [this.editingRankingScore.enumValue],
            score: [this.editingRankingScore.score, Validators.compose([Validators.required, Validators.pattern(/^[1-9][0-9]?$|^100$/)])]
        };
        this.rankingScoreForm = this.fb.group(formJSON);
    }

    editRankingScore(id: number) {
        this.editingRankingScore = null;
        if (id !== null) {
            const editingRankingScore = _(this.rankingScores).find((item) => item.id === id);
            this.editingRankingScore = _.cloneDeep(editingRankingScore);
            const criterium: any = _(this.criteria).find((item) => item.id === this.editingRankingScore.criteriumId);
            if (criterium.type === CriterionType.ListItem) {
                this.listItemRules = FormUtils.filterListItemsByListId(this.lists, criterium.listId);
            } else if (criterium.type === CriterionType.Enum) {
                this.enumRules = FormUtils.getEnumRules(criterium.name);
            }
        } else {
            this.editingRankingScore = {
                id: null, enabled: false, criteriumId: null, listItemId: null, enumValue: null, score: 1, schoolId: this.userInfo.schoolId, isDeleted: false
            };
        }
        this.createRankingScoreForm();
        $('#rsModal').modal('show');
    }

    criteriumChanged(id: number) {
        this.listItemRules = []
        this.enumRules = []
        this.rankingScoreForm.controls.enumValue.clearValidators();
        this.rankingScoreForm.controls.listItemId.clearValidators();
        this.rankingScoreForm.controls.listItemId.setValue(null);
        this.rankingScoreForm.controls.enumValue.setValue(null);
        if (id !== null) {
            const criterium: any = _(this.criteria).find((item) => item.id === id);
            if (criterium.type === CriterionType.ListItem) {
                this.rankingScoreForm.controls.listItemId.setValidators(Validators.required);
                this.listItemRules = FormUtils.filterListItemsByListId(this.lists, criterium.listId);
            } else if (criterium.type === CriterionType.Enum) {
                this.rankingScoreForm.controls.enumValue.setValidators(Validators.required);
                this.enumRules = FormUtils.getEnumRules(criterium.name);
            }
            this.rankingScoreForm.controls.enumValue.updateValueAndValidity();
            this.rankingScoreForm.controls.listItemId.updateValueAndValidity();
        } else {
            this.rankingScoreForm.controls.criteriumId.setValue(null);
        }
    }

    listItemChanged(id: number) {
        this.rankingScoreForm.controls.listItemId.setErrors(this.alreadyExist(id) ? { isAlreadyExist: true } : null);
    }

    enumChanged(id: string) {
        this.rankingScoreForm.controls.enumValue.setErrors(this.alreadyExist(id) ? { isAlreadyExist: true } : null);
    }

    private alreadyExist(id: number | string) {
        if (typeof id === 'number') {
            return _.find(this.rankingScores, i => i.listItemId === id) ? true : false;
        } else if (typeof id === 'string') {
            return _.find(this.rankingScores, i => i.enumValue === id) ? true : false;
        }
    }

    enabledChanged(id: number, isChecked: boolean) {
        this.pristine = false;
        this.submitted = false;
        _.forEach<RankingScore>(this.rankingScores, (r: RankingScore) => {
            if (r.id === id) {
                r.enabled = isChecked;
            }
        });
        this.calculateScore();
    }

    calculateScore() {
        this.maxScore = 0;
        _.forEach(this.rankingScores, (rs: RankingScore) => { rs.isGreen = false; });
        const ranking = _.groupBy((this.rankingScores).filter((item) => (item.enabled && !item.isDeleted)), 'criteriumId');
        _.forEach(ranking, (item: RankingScore[]) => {
            const maxRS: RankingScore = _.maxBy(item, 'score');
            _.forEach(this.rankingScores, (rs: RankingScore) => {
                if (maxRS.id === rs.id) {
                    rs.isGreen = true;
                }
            });
            this.maxScore = this.maxScore + maxRS.score;
        });
        this.isGreen = this.maxScore === 100 ? true : false;
    }

    saveRankingScore() {
        this.pristine = false;
        if (this.editingRankingScore.id !== null) {
            const criterium = _(this.criteria).find((item: Criterium) => item.id === this.rankingScoreForm.controls.criteriumId.value);
            const listRule = _(this.listItemRules).find((item) => item.id === this.rankingScoreForm.controls.listItemId.value);
            _.forEach<RankingScore>(this.rankingScores, (r: RankingScore) => {
                if (r.id === this.editingRankingScore.id) {
                    r.enabled = this.rankingScoreForm.controls.enabled.value;
                    r.criteriumId = this.rankingScoreForm.controls.criteriumId.value;
                    r.criterium = criterium;
                    r.criteriaName = r.criterium ? r.criterium.name : T.unknown;
                    r.listItemId = this.rankingScoreForm.controls.listItemId.value;
                    r.enumValue = this.rankingScoreForm.controls.enumValue.value;
                    r.listItem = listRule;
                    r.score = this.rankingScoreForm.controls.score.value;
                }
            });
        } else {
            this.countId = this.countId - 1;
            const criterium = _(this.criteria).find((item: Criterium) => item.id === this.rankingScoreForm.controls.criteriumId.value);
            const listRule = _(this.listItemRules).find((item) => item.id === this.rankingScoreForm.controls.listItemId.value);
            this.rankingScores.push({
                id: this.countId,
                enabled: this.rankingScoreForm.controls.enabled.value === null ? false : this.rankingScoreForm.controls.enabled.value,
                criteriumId: this.rankingScoreForm.controls.criteriumId.value,
                criterium,
                criteriaName: criterium ? criterium.name : T.unknown,
                listItemId: this.rankingScoreForm.controls.listItemId.value,
                enumValue: this.rankingScoreForm.controls.enumValue.value,
                listItem: listRule,
                score: this.rankingScoreForm.controls.score.value,
                schoolId: this.userInfo.schoolId,
                isDeleted: false
            });
        }
        this.calculateScore();
        this.rankingScores = _.orderBy(this.rankingScores, ['criteriaName', 'score'], ['asc', 'desc']);
        this.endAction();
    }

    endAction() {
        this.listItemRules = [];
        this.enumRules = [];
        $('#rsModal').modal('hide');
    }

    sliderChanged(value: number, id: number) {
        _.forEach<RankingScore>(this.rankingScores, (r: RankingScore) => {
            if (r.id === id) {
                r.score = value;
            }
        });
        if (_.find(this.rankingScores, (item: RankingScore) => item.id === id).enabled) {
            this.calculateScore();
        }
        this.pristine = false;
    }

    deleteRankingScore(id: number) {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this.',
            type: 'warning',
            showCancelButton: true,
            confirmButtonClass: 'btn btn-delete',
            cancelButtonClass: 'btn btn-cancel',
            confirmButtonText: 'Yes, delete it!',
            buttonsStyling: false
        }).then((result) => {
            if (result && result.value) {
                _.forEach(this.rankingScores, (r: RankingScore) => {
                    if (r.id === id && r.id < 0) {
                        _.remove(this.rankingScores, rankingScore => rankingScore.id === id);
                        this.calculateScore();
                    } else if (r.id === id) {
                        r.isDeleted = true;
                        this.calculateScore();
                    }
                });
            }
        });
        this.pristine = false;
    }

    public prepareScreen() {
        let sBrowser, sUsrAg = navigator.userAgent;
        if (sUsrAg.indexOf('Chrome') > -1) {
            sBrowser = 'Google Chrome';
        } else if (sUsrAg.indexOf('Safari') > -1) {
            sBrowser = 'Safari';
        } else if (sUsrAg.indexOf('Opera') > -1) {
            sBrowser = 'Opera';
        } else if (sUsrAg.indexOf('Firefox') > -1) {
            sBrowser = 'Mozilla Firefox';
        } else if (sUsrAg.indexOf('MSIE') > -1) {
            sBrowser = 'Microsoft Internet Explorer';
        }
        if (sBrowser === 'Safari') {
            const x: any = document.getElementsByClassName('checkbox');
            for (let i = 0; i < x.length; i++) {
                x[i].style.width = '30px';
            }
        }
    }

    public doSubmit(): Promise<boolean> {
        if (!this.pristine) {
            return this.submit().then(() => {
                Utils.showSuccessNotification();
                return Promise.resolve(true);
            }).catch((err) => {
                console.log(err);
                return Promise.resolve(false);
            });
        } else {
            return Promise.resolve(true);
        }
    }

    private submit(): Promise<void> {
        const rankingScores = _.cloneDeep(this.rankingScores.filter(rs => !rs.isDeleted));
        return this.promiseForBtn = this.httpService.postAuth(
            'ranking-score/update-ranking-score', { rankingScores }
        ).then(() => {
            return this.deleteRankingScores().then(() => {
                this.submitted = true;
                this.pristine = true;
                return this.getData();
            });
        }).catch((err) => {
            return Promise.reject();
        });
    }

    private deleteRankingScores(): Promise<void> {
        const deletedRankingScores = _.cloneDeep(this.rankingScores.filter(rs => rs.isDeleted));
        if (!_.isEmpty(deletedRankingScores)) {
            const promises: Array<Promise<Object>> = [];
            deletedRankingScores.forEach(rs => {
                promises.push(
                    this.httpService.deleteAuth(`ranking-score/delete/${rs.id}`)
                );
            });
            return Promise.all(promises).then(() => {
                return Promise.resolve();
            });
        }
        return Promise.resolve();
    }

    canDeactivate(): Promise<boolean> {
        return Utils.canDeactivate((!this.pristine) ? 1 : 0, this.submitted, (!this.pristine && this.maxScore === 100)).then((can) => {
            if (can === PageLeaveReason.save) {
                return this.doSubmit();
            } else if (can === PageLeaveReason.goBack) {
                return false;
            } else if (can === PageLeaveReason.doNotSave) {
                return true;
            }
        });
    }

    ngOnDestroy() {
        Utils.disposeModal('#rsModal');
    }
}
