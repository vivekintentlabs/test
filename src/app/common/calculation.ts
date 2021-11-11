import { RSCriterion } from './enums';
import { RankingScore } from '../entities/ranking-score';
import { ListItem } from '../entities/list-item';
import { Contact } from 'app/entities/contact';

import * as _ from 'lodash';

export class Calculation {

    public static calculateScore(
        actualApplicationDate, hasAlumni: string, siblingsId: number, religionId: number,
        currentSchool, rankingScores: Array<RankingScore>, applicationDate: Array<ListItem>
    ) {
        rankingScores = _.orderBy(rankingScores, ['score'], ['desc']);
        const appReceivedId = this.appDateId(actualApplicationDate, applicationDate);
        const classificationId = currentSchool != null ? currentSchool.classificationId : null;
        const statusId = currentSchool != null ? currentSchool.statusId : null;
        const studentScoreListIds = _([appReceivedId]);
        let score = _(rankingScores).filter(
            (item: RankingScore) => item.listItemId != null && studentScoreListIds.indexOf(item.listItemId) !== -1
        ).sumBy('score');
        score += this.getScoreByCriteria(rankingScores, RSCriterion.Siblings, { id: siblingsId });
        score += this.getScoreByCriteria(rankingScores, RSCriterion.Alumni, { enumValue: hasAlumni });
        score += this.getScoreByCriteria(rankingScores, RSCriterion.Religion, { id: religionId });
        score += this.getScoreByCriteria(rankingScores, RSCriterion.CurrentSchoolClassification, { id: classificationId });
        score += this.getScoreByCriteria(rankingScores, RSCriterion.CurrentSchoolStatus, { id: statusId });

        return score;
    }

    private static addMonths(months) {
        const cDate: Date = new Date;
        cDate.setMonth(cDate.getMonth() + months);
        return cDate;
    }

    private static getScoreByCriteria(
        rankingScores: Array<RankingScore>,
        criteriaId: number,
        options: { id?: number, enumValue?: string }
    ) {
        let score = 0;
        let rankingScoresByCriteria: Array<RankingScore> = [];
        rankingScoresByCriteria = _.filter(rankingScores, (item: RankingScore) => item.criteriumId === criteriaId);
        if (rankingScoresByCriteria.length > 0) {
            const rankingScoreByCriteria =
                _(rankingScores).find((rs: RankingScore) => options.id && rs.listItemId === options.id) ||
                _(rankingScores).find((rs: RankingScore) => options.enumValue && rs.enumValue === options.enumValue);
            if (rankingScoreByCriteria !== undefined) {
                score = score + rankingScoreByCriteria.score;
            }
        }
        return score;
    }

    private static appDateId(actualApplicationDate, applicationDate) {
        /* find out here if the student application date falls in one of the ranking score periods that give hime score points.
           Because application Date is at the moment a list, where the string values have no meaning,
           the code is now a little bit akward and error prone.
           Maybe make a special table for it in the future? */
        let appReceivedId = null;
        if (actualApplicationDate != null) {
            const m6 = this.addMonths(-6);
            const y1 = this.addMonths(-12);
            const y2 = this.addMonths(-24);
            const y3 = this.addMonths(-36);
            const m6Id = actualApplicationDate > m6 ? _(applicationDate).find((item) => item.name === '< 6 months').id : null;
            const y1Id = m6 >= actualApplicationDate && actualApplicationDate > y1 ? _(applicationDate).find((item) => item.name === '6 months - 1year').id : null;
            const y2Id = y1 >= actualApplicationDate && actualApplicationDate > y2 ? _(applicationDate).find((item) => item.name === '1 - 2 years').id : null;
            const y3Id = y2 >= actualApplicationDate && actualApplicationDate > y3 ? _(applicationDate).find((item) => item.name === '2 - 3 years').id : null;
            const y3mId = actualApplicationDate < y3 ? _(applicationDate).find((item) => item.name === '> 3 years').id : null;
            appReceivedId = _([m6Id, y1Id, y2Id, y2Id, y3Id, y3mId]).find((item) => item !== null);
        }
        return appReceivedId;
    }
}
