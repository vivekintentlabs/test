import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface MergeState {
  merge_state: string;
  merge_contact_ids: number[];
  merge_student_ids: number[];
}

export function createInitialState(): MergeState {
  return {
    merge_state: '',
    merge_contact_ids: [],
    merge_student_ids: [],
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'merge' })
export class MergeStore extends Store<MergeState> {

  constructor() {
    super(createInitialState());
  }

  updateMergeState(merge_state: string) {
    this.update({ merge_state });
  }

  updateMergeContactIds(ids: number[]) {
    this.update({ merge_contact_ids: ids });
  }

  updateMergeStudentIds(ids: number[]) {
    this.update({ merge_student_ids: ids });
  }

}

