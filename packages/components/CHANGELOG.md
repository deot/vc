# @deot/vc-components ChangeLog

## v1.2.2

_2026-10-07_

### Bugfixes

- fix: modal, center by layout and stop pinning the height by script ([24cad34](https://github.com/deot/vc/commit/24cad340619fce65008f60caabb82d7a24d10410))
- fix: scroller, use custom scrollbars whenever always is set and keep the thumb inside the track ([8edba22](https://github.com/deot/vc/commit/8edba227a076b85f17e3827ee1e79a75db90eead))

### Features

- feat: modal, add scrollerOptions, height="auto" and let scrollable turn off the built-in scroller ([eadb930](https://github.com/deot/vc/commit/eadb930d139f5437533fd4f01fcb9cfd16d50b38))
- feat: drawer, add scrollerOptions and let scrollable turn off the built-in scroller ([3f8e831](https://github.com/deot/vc/commit/3f8e83135d5a49abe9be84f80ed09b9d624bb169))
- feat: tour, build the bubble from the popover header/content/footer slots ([c72bb20](https://github.com/deot/vc/commit/c72bb2099e282a8c68fe1895be915bebdc1578b6))
- feat: popconfirm, keep the title and buttons fixed while the content scrolls ([c5c9c19](https://github.com/deot/vc/commit/c5c9c19c7b544a7bfdb13cd819790d9c2fbbddae))
- feat: dropdown, forward header/footer slots and scroller props to the popover ([74c0608](https://github.com/deot/vc/commit/74c060803d8ea0f1b43c0fa5ac9ced78cb834173))
- feat: popover, scroll the content with Scroller and add header/footer slots ([780baa2](https://github.com/deot/vc/commit/780baa25620068591109d706501229a4a93668d2))

### Updates

- style: form, remove the hard-coded font-family ([27ee66d](https://github.com/deot/vc/commit/27ee66df7bd32fdfc7476351a3f710b37576bcb2))
- style: pagination, remove the hard-coded font-family ([e196636](https://github.com/deot/vc/commit/e196636597b9fb41b0709e932b14784605efa904))
- style: tour, center the card without a target by layout ([c419fdb](https://github.com/deot/vc/commit/c419fdb106d84d056cbab412e1dc88045300110d))
- style: toast, center by layout instead of transform ([14f67c6](https://github.com/deot/vc/commit/14f67c67a9983cdee7d5c0c38314da83c30282c5))
- style: popup, center by layout so the content is not squeezed to half the viewport ([41b584c](https://github.com/deot/vc/commit/41b584ce14685d21ba6c033a7125f0485d389fd4))
- style: table, remove the delay prop ([e924f4a](https://github.com/deot/vc/commit/e924f4ab0b5da79fc9916e7d54002182b83a7068))
- style: table, keep the filter buttons fixed while the options scroll ([96bba2d](https://github.com/deot/vc/commit/96bba2d69f4104100405fed41a7c6e614ee036b8))
- style: date-picker, scroll the time columns with Scroller ([a9729e8](https://github.com/deot/vc/commit/a9729e83781b96f90db54fcf741f5869f860c65e))
- style: cascader, scroll the columns with Scroller and avoid nested scrolling ([1892e06](https://github.com/deot/vc/commit/1892e0648604f1d89570253ecfe69d7609e2f9ff))
- style: tree-select, avoid nested scrolling in the popup ([a32274b](https://github.com/deot/vc/commit/a32274b6b04b8c1ab32dbe0719a8be3123c3b3e2))
- style: select, scroll the options with the popover's built-in scroller ([47e6b98](https://github.com/deot/vc/commit/47e6b9868f83e8321464599ed4437d35ffa1ae58))
- style: tour, align the title with the close icon and move the scrollbar to the card edge ([85f337b](https://github.com/deot/vc/commit/85f337b1171b16a0eedb85f5430f7fcbd5b113b1))

## v1.2.1

_2026-10-06_

### Bugfixes

- fix: declare @deot/vc-hooks and @deot/vc-shared dependencies ([3692656](https://github.com/deot/vc/commit/3692656d0bb9e88c8004f90d6dfcebfea7367b00))

## v1.2.0

_2026-10-06_

### Updates

- refactor: move full registration into @deot/vc-full ([f8bb1da](https://github.com/deot/vc/commit/f8bb1da3e76f8a343f1bf6834fe29996bb37a606))
