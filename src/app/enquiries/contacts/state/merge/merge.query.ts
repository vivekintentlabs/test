import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { MergeStore, MergeState } from './merge.store';

@Injectable({ providedIn: 'root' })
export class MergeQuery extends Query<MergeState> {
  merge_state$ = this.select(state => state.merge_state);
  merge_contact_ids$ = this.select(state => state.merge_contact_ids);
  merge_student_ids$ = this.select(state => state.merge_student_ids);

  constructor(protected store: MergeStore) {
    super(store);
  }

}
