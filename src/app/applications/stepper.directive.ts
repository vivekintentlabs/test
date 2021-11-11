import { Directive, Input, OnChanges, SimpleChanges } from "@angular/core";

@Directive({
  selector: '[stepDisable]' // https://stackoverflow.com/a/63520158
})
export class StepperDirective implements OnChanges {
  @Input('stepDisable') isDisabled;
  @Input() index;
  observer: MutationObserver // observes changes in DOM
  stepElement: HTMLElement;

  public ngAfterViewInit(): void {
    if (this.isDisabled !== null) {
      this.observer = new MutationObserver(mutations => {
        this.stepElement = document.getElementsByClassName('mat-step-header')[this.index] as HTMLElement;
        this.isDisabled ? this.disable() : this.enable();
      });
      this.observer.observe(document.getElementsByClassName('mat-horizontal-stepper-header-container')[0], { childList: true });
      // mat-step-header is not in the DOM in beginning, so we observe parent of mat-step-header,
      // which is mat-horizontal-stepper-header-container, and when some changes happen in its children, it will
      // disable or enable mat-step-header
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.isDisabled && this.isDisabled !== null) {
      this.isDisabled ? this.disable() : this.enable();
    }
  }

  private enable(): void {
    this.stepElement?.classList.remove('mat-step-disabled');
  }

  private disable(): void {
    this.stepElement?.classList.add('mat-step-disabled');
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }

}
