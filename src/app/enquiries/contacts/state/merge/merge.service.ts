import { Injectable } from '@angular/core';
import { MergeStore } from './merge.store';

@Injectable({ providedIn: 'root' })
export class MergeService {

  constructor(private mergeStore: MergeStore) { }

  setMergeState(merge_state: string) {
    this.mergeStore.updateMergeState(merge_state);
  }

  setMergeContactIds(ids: number[]) {
    this.mergeStore.updateMergeContactIds(ids);
  }

  setMergeStudentIds(ids: number[]) {
    this.mergeStore.updateMergeStudentIds(ids);
  }

  getMergeState(): string {
    return this.mergeStore.getValue().merge_state;
  }

  getMergeContactIds(): number[] {
    return this.mergeStore.getValue().merge_contact_ids;
  }

  getMergeStudentIds(): number[] {
    return this.mergeStore.getValue().merge_student_ids;
  }
}
