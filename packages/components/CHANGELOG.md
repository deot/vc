# @deot/vc-components ChangeLog

## v1.2.4

_2026-10-27_

### Bugfixes

- fix: tree-select, keep half-checked ancestors out of the value when removing a tag ([16999f1](https://github.com/deot/vc/commit/16999f17cd67a4fe83a520fe9ec7baecc9623714))
- fix: tree-select, expand the checked nodes only when the panel opens ([6039680](https://github.com/deot/vc/commit/60396806fa182a55f8cb59c2944450487ba8dd72))
- fix: recycle-list, do not compensate again for the scroll written by a displacement ([de1cd66](https://github.com/deot/vc/commit/de1cd6689bb45f6bff6435f5c7b2de6354b293b4))
- fix: recycle-list, measure external bounds in scroll coordinates under scaled ancestors ([43946db](https://github.com/deot/vc/commit/43946db0251fe2ea4a317ece4588532065a40216))
- fix: popover, keep the focus on the trigger only when the focus is already inside it ([d9a50a0](https://github.com/deot/vc/commit/d9a50a04e840aa63a2e59a3f2c19a705afcf13e7))
- fix: popover, reopen a popup that is still asked to open after KeepAlive reactivation ([8b67ad4](https://github.com/deot/vc/commit/8b67ad4fbdfa1aee50c9bc463b3fa399980edbfe))
- fix: cascader, expand columns on real pointer moves only ([5602e56](https://github.com/deot/vc/commit/5602e564898a1ba8525f5508845adb4495c1956f))
- fix: affix, follow the container width and content height while pinned ([a450583](https://github.com/deot/vc/commit/a450583ccc77c753deab56cfb27d4b4e48a98b16))
- fix: file-preview, close during a slide from where the stage is ([f1febd0](https://github.com/deot/vc/commit/f1febd037d46458585302d1dce4f718cddfc1242))
- fix: transition, read enter and leave timings with timingOf ([23fee86](https://github.com/deot/vc/commit/23fee86e7cb75c5bac84b32a6ddea53abaaf3e6a))
- fix: editor and upload-picker, adapt to the new file-preview ([e490f47](https://github.com/deot/vc/commit/e490f4751263752c0fee9e6787815f7b4b6b0694))
- fix: slider, update the tip text while dragging ([d3429b3](https://github.com/deot/vc/commit/d3429b3bdc222f9a16779e7c04e551ff69acfac6))
- fix: date-picker, scroll the time columns to the selected time when they show ([c48015f](https://github.com/deot/vc/commit/c48015fcfe97e1ebe2e29790666b9820cd7a79c2))
- fix: date-picker, disable months by their own length and parse an unpadded D ([7f3279b](https://github.com/deot/vc/commit/7f3279b969cc06558a461d25188a6e679e7b9721))
- fix: select, clear the keyword after the popup has closed ([309d617](https://github.com/deot/vc/commit/309d617f7277405ef14c0a2e6de20de209f1a5b3))
- fix: lay out inline components like text ([f905aca](https://github.com/deot/vc/commit/f905acad1e0aa2b1d36c78c4d098e63a3d6ac300))
- fix: table, center the sort and tooltip icons in the header ([6a8fc53](https://github.com/deot/vc/commit/6a8fc53e8cbf67d9f38de1ef786689519a2e00e6))
- fix: button, use one layout for every state and align loading, icon and text ([2741d3d](https://github.com/deot/vc/commit/2741d3d5bcf17d8b63163c377ece261ecc376dec))
- fix: icon, lay out icons like text in a character box ([d82e0f1](https://github.com/deot/vc/commit/d82e0f1a4a95384e0935c8dfe24792aba626e839))
- fix: recycle-list, keep the list in place when content before an external list changes ([2162f33](https://github.com/deot/vc/commit/2162f335d893476b6c4bcdf6a9e438372e7a1b6d))
- fix: modal, close only the topmost layer on Escape ([d95c81f](https://github.com/deot/vc/commit/d95c81f7cc8114a90f98b6f79d954b0676d1a45f))
- fix: prevent the first ButtonGroup button from being clipped ([72502dd](https://github.com/deot/vc/commit/72502dd98901ddadc9b6eeb01a0f0652399a6282))
- fix: style, draw the 1px border with a fractional border-width instead of transform scaling ([27db091](https://github.com/deot/vc/commit/27db091b9d55f0a6d5831792dc081dc12699ba1d))
- fix(hooks): use-attrs, recompute when attrs are added after starting empty ([2ec643e](https://github.com/deot/vc/commit/2ec643e6502bf14ca2fe8ee6aa3a3ef2c782db03))

### Features

- feat: tree, merge checkStrictly into checkStrategy to choose what v-model holds ([26a4797](https://github.com/deot/vc/commit/26a479776b3a5cc220012a2a613f4a9ff93e35cc))
- feat: recycle-list, add ifNeeded to scrollToIndex so fully visible items are left in place ([e630220](https://github.com/deot/vc/commit/e630220e48eaf5a0b52faaaf273fbfdd3cf82ca0))
- feat: tree, restore the expanded state when the filter is cleared ([7b00856](https://github.com/deot/vc/commit/7b0085622e07cfaa78f0c204fe8e4865a6b5aa4f))
- feat: select, pause hover styles on rows while the list scrolls ([ffd30dd](https://github.com/deot/vc/commit/ffd30dd9fd3da53baef476e82631273a1535fa7c))
- feat: tree, add virtualized to render nodes with RecycleList ([46fa586](https://github.com/deot/vc/commit/46fa58648367ec0b2cd8705ad92a06b0f3033d64))
- feat: tree, drag nodes with pointer events ([af25061](https://github.com/deot/vc/commit/af25061128b3408f751da01a086e81eac39ed5e4))
- feat: tree, navigate by visible rows and highlight in tree-select ([af8abc7](https://github.com/deot/vc/commit/af8abc7575fd2bf5c345d2f08f5c092271770726))
- feat: tree-select, add virtualized for the cascader mode ([735cc06](https://github.com/deot/vc/commit/735cc063113dfe457278bcfeeb2c1504f9aadb2c))
- feat: cascader, add virtualized for columns and search results ([6245d7a](https://github.com/deot/vc/commit/6245d7a920b8ae01f6fbe1d522ca6064e5e136e7))
- feat: select, add virtualized to render options with RecycleList ([4d73bea](https://github.com/deot/vc/commit/4d73beaeadd76c6279b9a7ced288f83f9e813ee0))
- feat: recycle-list, scrollToIndex aligns to the nearest edge ([5f014e1](https://github.com/deot/vc/commit/5f014e135f5b74839a7ea36bca69a21536611947))
- feat: cascader, scroll columns to the selected items with the shared helper ([7ad6782](https://github.com/deot/vc/commit/7ad6782894d63e21eb4c879a2afafaf2115d5ef6))
- feat: select, scroll to the first selected option on open ([f17355f](https://github.com/deot/vc/commit/f17355f93484bfa3f1be5ffffc68aa00fe779c20))
- feat: cascader, add expandDirection to expand columns to the left ([dd49503](https://github.com/deot/vc/commit/dd4950329584dfc15c20314b7ce8b47e3ccf8472))
- feat: popover, keep the edge under the pointer while the content shrinks ([65a6909](https://github.com/deot/vc/commit/65a6909487fe3e6e5cf9d3acdb879320d76ee076))
- feat: modal, open from the clicked element and close back to it ([f8c2d1d](https://github.com/deot/vc/commit/f8c2d1d02d2bf1363128a722e4609574cf8c6ed0))
- feat: transition, add TransitionReveal that opens from the trigger element ([b08e980](https://github.com/deot/vc/commit/b08e980c4b1061cc9bb390146ac83e0c83366db8))
- feat: file-preview, rewrite viewer with photoswipe-like zoom open and close ([41686ac](https://github.com/deot/vc/commit/41686ac62adff7ad2f52336f5d67778ddb3e672c))
- feat: replace touch with gesture ([e14585f](https://github.com/deot/vc/commit/e14585f672a5bd65ba16bd1cd4643c3f1130b928))
- feat: popover, add keepFocus to keep the focus in the trigger's input ([cb2e6f1](https://github.com/deot/vc/commit/cb2e6f15def1b84b3c40978448788ce99e5c98dc))
- feat: popover, render the popup with Teleport and rename getPopupContainer to to ([32b8729](https://github.com/deot/vc/commit/32b8729613f1442755462b5b78b90113ee210fe0))
- feat: date-picker, type dates and times into the input ([6dfd586](https://github.com/deot/vc/commit/6dfd586581d30aea83b8196548c90da8558365ba))
- feat: badge, add the badge component ([286e43f](https://github.com/deot/vc/commit/286e43fae70267ebc1b0dc0c1683fcf049b35b5d))
- feat: recycle-list, scroll natively by default ([6b7b9a6](https://github.com/deot/vc/commit/6b7b9a6d144056ad0aeec319d1e29984c8529e59))
- feat: watermark, add the watermark component ([23bb8fb](https://github.com/deot/vc/commit/23bb8fb3323f962b995bb85fd9fb377b5e499ed0))
- feat: select, search by typing in the trigger for Select, TreeSelect and Cascader ([285f0da](https://github.com/deot/vc/commit/285f0dae7f848098d5d462cbd1237e6801d7d77d))
- feat: popover, skip the header and footer wrappers when the slots render nothing ([48ce082](https://github.com/deot/vc/commit/48ce08235b4d5a425bcba2fa93214136b98008c8))
- feat: customer, render content props through one entry and sanitize HTML in one place ([f968c6e](https://github.com/deot/vc/commit/f968c6e0e8d0a7e5e038e26fcdb5f6212c7c2bb3))
- feat: editor, preview images in EditorView on click ([99c7257](https://github.com/deot/vc/commit/99c7257f011d3f36282f0cbefb062feda12e2ab1))
- feat(hooks): use-gesture, unify tap, long-tap, swipe and pinch gestures ([a638f95](https://github.com/deot/vc/commit/a638f95ca77cf2bf6f7a8ee64b6671926d239f9b))
- feat(hooks): use-keyboard, subscribe to the shared Keyboard while a condition holds ([c6de049](https://github.com/deot/vc/commit/c6de049086c22f02a9283d53eaf1a9b010ce2fcf))
- feat(locale): add file-preview viewer texts ([3645b85](https://github.com/deot/vc/commit/3645b856a2ecdd9fa2d5e0ac29e6580033ce11be))

### Updates

- perf: tree, recompute ancestors once per batch of cascade checks ([3bdc764](https://github.com/deot/vc/commit/3bdc7645623a6bffd4f17ba01436498203a5b766))
- perf: tree, read raw states when summarizing child checks ([586e160](https://github.com/deot/vc/commit/586e1604991955d3f98181f597ab55febcf58030))
- perf: tree-select, group the checked paths with a prefix tree ([cfd53b3](https://github.com/deot/vc/commit/cfd53b331b2d49019079b317452e6fd551135408))
- style: scroller, move the scroll carrier out of recycle-list and share axis keys ([e7f7abe](https://github.com/deot/vc/commit/e7f7abec3ed60cbeeda75ac082e4ef6558435bcb))
- perf: tree, render leaf icons as static placeholders and walk raw state when syncing checks ([be5c327](https://github.com/deot/vc/commit/be5c32742935fd12b69e50281a1e609dceeaeb03))
- style: tree, move the tree-select highlight into tree and share row lookup and arrow rules ([b06c2cc](https://github.com/deot/vc/commit/b06c2cc90941b9054c6f2f975c531a6a4bfea225))
- style: drag, share auto-scroll and hit helpers and keep tree drop state off the render path ([1dc5aa5](https://github.com/deot/vc/commit/1dc5aa55c8fe6c25eff532c9cdc6eba3d87b705f))
- style: select, simplify the shared list, index navigation and cascader check sync ([2919f20](https://github.com/deot/vc/commit/2919f20782e3ba2f1347a9cf49434220843f9164))
- style: recycle-list, measure the external carrier once per refresh and read geometry only from raw ([bfe5db1](https://github.com/deot/vc/commit/bfe5db143558c091e77ec284b20bb9dff7192359))
- perf: tree, build tree nodes without going through reactive proxies ([eff12ee](https://github.com/deot/vc/commit/eff12ee3ac9cd27d411689701133a0a5eaffe242))
- perf: recycle-list, keep node geometry off the reactive path ([400b9b1](https://github.com/deot/vc/commit/400b9b14b92e52de4dd8a5be6d05152ced2cdc0c))
- perf: tree-select, keep cascader check state in a TreeStore instead of a hidden tree ([a8034eb](https://github.com/deot/vc/commit/a8034eb6f536afd6c461c20f4c946beb92aba2bc))
- style: tree, render visible nodes as flat rows ([dc35772](https://github.com/deot/vc/commit/dc357727b093b4ce813c9dfcd1dc35bc86954ce4))
- style: table, move drag and drop helpers to a shared internal module ([17b4178](https://github.com/deot/vc/commit/17b41782edfbfdfdcd90386456d85e66d2995443))
- style: select, share one list and index navigation across select, paths and cascader columns ([e2ca8dc](https://github.com/deot/vc/commit/e2ca8dc357326f2cd2a017db349bf3c2729bc661))
- style: cascader, share one column renderer with tree-select ([17e802b](https://github.com/deot/vc/commit/17e802b874ebc7dc3461b82e9029df353d45b344))
- refactor: file-preview, open and close the viewer with transition reveal ([17751b2](https://github.com/deot/vc/commit/17751b28ca54bf5bd59dfef1cfaab6af49514155))
- refactor: popover, move keepFocus into the popover utils ([0c7854c](https://github.com/deot/vc/commit/0c7854cf3cbeffc3bae69e1923b5046712c3567c))
- refactor: subscribe to the shared Keyboard through useKeyboard ([9b4813e](https://github.com/deot/vc/commit/9b4813e5bc5bbafa31a41c2edd0c617082257d3e))
- refactor: image-processor, move the image loader into utils ([e779afd](https://github.com/deot/vc/commit/e779afd86b5bc01ecbab7616e62c6fe35961e025))
- refactor: pass a single object to every global hook ([590cfee](https://github.com/deot/vc/commit/590cfeee8f4a488c49fb6cce9b04f512a0a51164))
- chore(shared): force-publish `1.2.0` -> `1.2.4`

## v1.2.3

_2026-10-07_

### Bugfixes

- fix: button, correct the solid styles and keep vertical group buttons the same width ([811a49f](https://github.com/deot/vc/commit/811a49fb4da70080a835ba8e94c02976196be2c9))
- fix: recycle-list, keep the visible range right when content before an external list changes ([4b8423e](https://github.com/deot/vc/commit/4b8423e69695fedaae59f2a7d5e4c4e21fe0f76c))

### Updates

- style: tree, fill the missing keyValue fields with defaults ([934edff](https://github.com/deot/vc/commit/934edffc970c75699aec1a5241d60a330f9e3445))
- style: table, rename treeMap to keyValue and expandRowValue to expandedValues ([7f181f2](https://github.com/deot/vc/commit/7f181f20b92e629a63f100199910fc7a39ffeba8))

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
