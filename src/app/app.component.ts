import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  linkedSignal,
  OnInit,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { createSwapy, utils } from 'swapy';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'test-swapy-dynamic';
  _swapyContainer = viewChild<ElementRef<HTMLDivElement>>('swapyContainer');
  swapyContainer = computed(() => this._swapyContainer()?.nativeElement);

  swapy?: ReturnType<typeof createSwapy>;

  _exampleItems = Array.from({ length: 3 }, (_, i) => ({
    value: `value-${i}`,
    index: i.toString(),
  }));
  exampleItems = signal(this._exampleItems);

  _id = 3;
  addItem() {
    this.exampleItems.update((items) => [
      ...items,
      { value: `value-${this._id}`, index: (this._id++).toString() },
    ]);
  }

  // swapy manual
  slotItemMap = signal(utils.initSlotItemMap(this.exampleItems(), 'index'));
  slottedItems = linkedSignal(() =>
    utils.toSlottedItems(this.exampleItems(), 'index', this.slotItemMap())
  );
  slotItemsEffect = effect(() => {
    const items = this.exampleItems();
    console.log('Effect items: ', items);
    utils.dynamicSwapy(
      this.swapy ?? null,
      items,
      'index',
      untracked(this.slotItemMap),
      this.slotItemMap.set
    );
  });

  ngOnInit() {
    const container = this.swapyContainer();
    if (container) {
      this.swapy = createSwapy(container, {
        animation: 'dynamic',
        dragAxis: 'y',
        manualSwap: true,
      });

      this.#swapyTestEvents();
    }
  }
  ngAfterViewInit() {
    this.swapy?.update();
  }

  #swapyTestEvents() {
    if (!this.swapy) return;
    this.swapy.onBeforeSwap((event) => {
      console.log('before swap');
      // This is for dynamically enabling and disabling swapping.
      // Return true to allow swapping, and return false to prevent swapping.
      return true;
    });

    this.swapy.onSwapStart((event) => {
      console.log('swap start');
    });

    this.swapy.onSwap((event) => {
      console.log('swap');
      requestAnimationFrame(() => {
        console.log('Old slotItemMap:', this.slotItemMap());
        console.log('New slotItemMap:', event.newSlotItemMap.asArray);
        this.slotItemMap.set(event.newSlotItemMap.asArray);
      });
    });

    this.swapy.onSwapEnd((event) => {
      console.log('swap end');
    });
  }
}
