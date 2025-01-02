import { NgFor } from '@angular/common';
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
import { createSwapy, Swapy, utils } from 'swapy';

@Component({
  selector: 'app-root',
  imports: [NgFor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'test-swapy-dynamic';
  _swapyContainer = viewChild<ElementRef<HTMLDivElement>>('swapyContainer');
  swapyContainer = computed(() => this._swapyContainer()?.nativeElement);

  swapy?: Swapy;

  _exampleItems = Array.from({ length: 3 }, (_, i) => ({
    value: `value-${i}`,
    index: i.toString(),
  }));
  exampleItems = signal(this._exampleItems);

  addItem() {
    const idx = this.exampleItems().length;
    this.exampleItems.update((items) => [...items, { value: `value-${idx}`, index: idx.toString() }]);
  }

  // swapy manual
  slotItemMap = signal(utils.initSlotItemMap(this.exampleItems(), 'index'));
  slottedItems = linkedSignal(() => {
    console.log('Linked items: ', utils.toSlottedItems(this.exampleItems(), 'index', this.slotItemMap()));
    return utils.toSlottedItems(this.exampleItems(), 'index', this.slotItemMap())
  }
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
        // swapMode: 'drop'
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
      console.log('before swap', event);
      // This is for dynamically enabling and disabling swapping.
      // Return true to allow swapping, and return false to prevent swapping.
      return true;
    });

    this.swapy.onSwapStart((event) => {
      console.log('swap start', event);
    });

    this.swapy.onSwap((event) => {
      console.log('swap', event);
      requestAnimationFrame(() => {
        this.slotItemMap.set(event.newSlotItemMap.asArray);
      });
    });

    this.swapy.onSwapEnd((event) => {
      console.log('swap end:', event);
    });
  }
}
