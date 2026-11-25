# @deot/vc-components ChangeLog

## v1.2.7

_2026-11-25_

### Bugfixes

- fix: table, tree, keep typeof in the generated prop declarations ([43b3bfd](https://github.com/deot/vc/commit/43b3bfdb549d1c02dafbbee956fc7ce6c848ec3b))
- fix: countdown, stop showing negative fields after the target time ([adc5596](https://github.com/deot/vc/commit/adc55965a0c479972ff95c82cdf84f56fad0cf4b))
- fix: date-picker, keep the other range panel still when paging with splitPanels ([6422f81](https://github.com/deot/vc/commit/6422f8160bb304ddb251b0ac678c581b5d35acf4))
- fix: intersection, report hidden after refresh while visible ([f316c53](https://github.com/deot/vc/commit/f316c53160d38c968e1b146374a66c247f39ef04))
- fix: image, find the vc Scroller for lazy loading and load through the shared IntersectionObserver, drop wrapper ([1dd7776](https://github.com/deot/vc/commit/1dd7776e10c04ad43e63fe590c362bd9387d5b64))
- fix: spin, fade and blur the wrapped content instead of painting a mask color ([95c025c](https://github.com/deot/vc/commit/95c025c5eb5ad002b68c842857766a1ba79fcf90))
- fix: notice, keep text clear of the close icon, render loading with Spin and pause on hover ([cac7eef](https://github.com/deot/vc/commit/cac7eef5e2fe9959e00c38c44bab29df7ff706e8))
- fix: message, stack messages without overlap and pause on hover ([4747f87](https://github.com/deot/vc/commit/4747f872304d0b482ae382cb4056d830edd7a9d2))
- fix: editor, emit focus/blur once, keep spaces breakable, wire poster, block edits while disabled and apply line-height per line ([1bd33e3](https://github.com/deot/vc/commit/1bd33e3ef61e550dcce4170924a07d2a29f3d425))
- fix: image, share the skeleton shimmer so the loading placeholder animates ([09b395b](https://github.com/deot/vc/commit/09b395bbdbf67d3ac0a073ef9eec0a9d72b79dcd))
- fix: drawer, lay out the footer in flow, make close a button and add closable and escClosable ([e32a46e](https://github.com/deot/vc/commit/e32a46e843df9a180dbb75ada4e87db7557ee4a3))
- fix: portal, mount the container inside the document before moving its children out ([3748f70](https://github.com/deot/vc/commit/3748f70becdf14352490a33745ebe5f9998a4b85))
- fix: form, stop field change and blur validation from leaving unhandled rejections ([91071d1](https://github.com/deot/vc/commit/91071d1c6fd104257ce0dd561f3bd559126c70f7))
- fix: picker, drop the default tap highlight on mobile trigger wrappers ([b5a162d](https://github.com/deot/vc/commit/b5a162d2688c8f9175780f620df45b287db91d1b))
- fix: button, keep hover off touch screens and give a lighter pressed state ([c8bec7c](https://github.com/deot/vc/commit/c8bec7c694eb52f4565fdac0fe96569a60f24f98))
- fix: tabs, leave MTabs swipe alone when an inner component has taken the gesture ([578197f](https://github.com/deot/vc/commit/578197faf392a7489615a45e0e29c528a899f0f9))
- fix: steps, lay out labels below/above in equal columns and fix narrow, touch and keyboard use ([f27916e](https://github.com/deot/vc/commit/f27916e69970ce1587cd25cb4becd372f858ac83))
- fix: cascader, output the whole path for string values regardless of max ([c6ea4fd](https://github.com/deot/vc/commit/c6ea4fda4540cb31020fad7c818fef09766cd576))
- fix: select, join numerable string values with the separator and return nullValue when cleared ([69726c2](https://github.com/deot/vc/commit/69726c271b0b7d6d1a312e5aa9bd176ecfc5ac3f))
- fix: tabs, only read a rendered tab item as the active one ([90a0bdf](https://github.com/deot/vc/commit/90a0bdfd16be55b47521675c680a1145c1b534d5))
- fix: file-preview, detect data url types, names and extensions from the media type ([d7736ff](https://github.com/deot/vc/commit/d7736ffc1c88df1537f77b98325709f898fb4c54))

### Features

- feat: select, add searchMatch to configure search separators ([f723822](https://github.com/deot/vc/commit/f7238220f1eb8550ad84ffbcbeb907a9d4d8d437))
- feat: color-picker, add plaintext to render the value as text ([38e908f](https://github.com/deot/vc/commit/38e908fa058f25676e0cc7ceaecc2e11b14f6922))
- feat: date-picker, add plaintext to render the value as text ([41944d6](https://github.com/deot/vc/commit/41944d6b97558108c622f3273f99cac4aac1ed99))
- feat: tree, add plaintext and formatter to TreeSelect ([85c17eb](https://github.com/deot/vc/commit/85c17eb661c87d940be3b9ea306971ec4837f039))
- feat: cascader, add plaintext to render the path as text ([2f1c396](https://github.com/deot/vc/commit/2f1c3969dfbe21e43a17fe62058de78c36d84596))
- feat: select, add plaintext and formatter ([55eec51](https://github.com/deot/vc/commit/55eec5120e33b5a18320203d1bdb6247ff30bc5b))
- feat: picker, add plaintext to MPicker ([8e863d7](https://github.com/deot/vc/commit/8e863d74a945ca4a8f2aeb94dd5343cd18e9fee6))
- feat: textarea, add plaintext to render the value as text ([d74604e](https://github.com/deot/vc/commit/d74604ed5f670d6a4019857390af0cc176e29ee6))
- feat: input, add plaintext to render the value as text ([9f9a148](https://github.com/deot/vc/commit/9f9a148c8af39a8f6177c0074da40f228b19fc30))
- feat: float-button, add FloatButton and MFloatButton ([d5b5ce2](https://github.com/deot/vc/commit/d5b5ce24bc72c1ac95586367e94a2a28bb35a377))
- feat: back-top, add BackTop and MBackTop ([70981c6](https://github.com/deot/vc/commit/70981c6416f34cfbfa45544a54b4255db981056f))
- feat: notice, make MNotice a fixed full-width top banner with swipe-up close ([2d75cb7](https://github.com/deot/vc/commit/2d75cb7c8a8e1a89e98fe3557978e1a85324aca3))
- feat: alert, add marquee and prefix/suffix slots, make MAlert a mobile component ([1d17198](https://github.com/deot/vc/commit/1d17198c0973b036ddd77b3884f31bf953b37927))
- feat: intersection, add Intersection and MIntersection to watch content entering the scroller viewport ([33e9130](https://github.com/deot/vc/commit/33e913013138466c79d91a4f6de633f334297dad))
- feat: calendar, add selection and a year view, make MCalendar a mobile component and add MCalendarPicker ([1614315](https://github.com/deot/vc/commit/161431530d08f44f74e4e597def73ada2a2961f2))
- feat: date-picker, calendar, add firstDayOfWeek to DatePicker and a global default for both ([279ccb3](https://github.com/deot/vc/commit/279ccb3ae054880e84fff61cdc73a39f030b84cd))
- feat: nav-bar, add MNavBar for the page header on mobile ([d5d1634](https://github.com/deot/vc/commit/d5d163497820cbbeeae4d57074da2a4255b697fa))
- feat: tab-bar, add MTabBar and MTabBarItem for bottom navigation on mobile ([15f81bf](https://github.com/deot/vc/commit/15f81bfd953eb0a9d2bb1ba4df38966d0ef986fe))
- feat: auto-complete, mention, add AutoComplete and Mention on a shared suggestion core, with mentions in Editor ([89ae1f4](https://github.com/deot/vc/commit/89ae1f4232596442e35e6a8c1728bf173ef389e4))
- feat: spin, wrap content with a loading layer, add tip and delay, rename colors to color and trackColor ([98a39f8](https://github.com/deot/vc/commit/98a39f828f7cc2e089356e60bba3b22996f03a26))
- feat: toast, follow the arco mobile Toast with status icons, placement and mask ([1ad382f](https://github.com/deot/vc/commit/1ad382f349753fb1338661d048878e92d792e61b))
- feat: editor, add MEditor / MEditorView with a single-row toolbar, sheet pickers and a keyboard-docked toolbar ([12065c0](https://github.com/deot/vc/commit/12065c0432599036934560a9c7b4464db7e6a2f8))
- feat: editor, render the toolbar with dropdowns, color panel and link prompt instead of Quill snow ([557125b](https://github.com/deot/vc/commit/557125b0dd74cb226d45574b2c32743482abe508))
- feat: splitter, add Splitter and SplitterPanel with px / % sizes, collapse, keyboard, lazy and custom handle ([7f7e7d0](https://github.com/deot/vc/commit/7f7e7d06cf33b472a73993fe2fd4c71001f1030e))
- feat: skeleton, add Skeleton and SkeletonItem with presets, custom placeholder, repeat and delay ([aa3121f](https://github.com/deot/vc/commit/aa3121f4f00dd7dda2c364e3d4680210b121af4a))
- feat: image-crop, rewrite on DOM with gestures, resizable frame, crop data and open ([8118175](https://github.com/deot/vc/commit/8118175d82da0d3057d879323474ed2cdd2240c0))
- feat: drawer, add MDrawer on MPopup with confirm and cancel buttons ([ac08a27](https://github.com/deot/vc/commit/ac08a2779c06641e96db549feedd4d977d8414bc))
- feat: progress, add MProgress, textInside, disabled, slot params and mount transition ([b2f5424](https://github.com/deot/vc/commit/b2f542488e3d58d80f96bf77aa1c1c1947e11d96))
- feat: marquee, loop seamlessly and add direction, gap, always, pauseOnHover, delay and loop ([f716884](https://github.com/deot/vc/commit/f716884034a3db47009b14ca7ecb729fc98c58ce))
- feat: picker, date-picker, add virtualized to render only the rows near the wheel ([f7dfb0d](https://github.com/deot/vc/commit/f7dfb0d62170520a6f4a16167f682abdffa5bcf6))
- feat: tree-select, center the checked node in MTreeSelect with scrollToNode ([ca81cc0](https://github.com/deot/vc/commit/ca81cc02c310726c3c1de609b5b775ceb03c5466))
- feat: tree, add scrollToNode ([853bc8e](https://github.com/deot/vc/commit/853bc8ea23b3aa2cdb79d29868951729266fc59a))
- feat: cascader, add virtualized to MCascader ([8fdb2a7](https://github.com/deot/vc/commit/8fdb2a7673f64c5faac9d31c32561d4a4fbdbaa3))
- feat: select, add virtualized to MSelect with a floating sticky group title ([208ffe1](https://github.com/deot/vc/commit/208ffe193c6ece40a8a93d24e958c9d744017945))
- feat: recycle-list, center items with scrollToIndex and keep the target aligned while sizes settle ([8616066](https://github.com/deot/vc/commit/8616066db499e9c1fae9f59c64158e4dcd220756))
- feat: select, accept boolean values for modelValue and option value ([6fce0dd](https://github.com/deot/vc/commit/6fce0dd1fc9e3710a426d2a0ec4dd536eae99595))
- feat: picker, action-sheet, resolve the mobile open() with the onOk result ([c4b82ef](https://github.com/deot/vc/commit/c4b82ef61527a4a4a00bbdfe2bd39ba4f55a1526))
- feat: color-picker, make MColorPicker a mobile component with a list item trigger, a bottom popup and open() ([d85cde5](https://github.com/deot/vc/commit/d85cde52d0dc7a7abf68da849205ab9fe4ef9ad5))
- feat: color-picker, commit on pick by default, add clearable / nullValue / trigger slot, reuse Slider for the hue and alpha bars ([bea3b32](https://github.com/deot/vc/commit/bea3b32b752c39ac1985ad7e0966724524afe754))
- feat: slider, start dragging from any point on the track with the mouse ([ea79c35](https://github.com/deot/vc/commit/ea79c357d6f57046dbf0a54a3a08cb5029f7359d))
- feat: grid, make MGrid a mobile component in 750 units ([d5cb911](https://github.com/deot/vc/commit/d5cb911f51261b52dee4d71b497c0adb94cb476f))
- feat: descriptions, make MDescriptions a mobile component in 750 units ([e00b201](https://github.com/deot/vc/commit/e00b2017c4f68a7dad38455717dfddb68ddc238b))
- feat: list, support swipe actions on MListItem ([d26887c](https://github.com/deot/vc/commit/d26887caaa619447fed86983f1d78053f181877c))
- feat: swipe-action, add MSwipeAction to reveal actions by swiping left or right ([01ca224](https://github.com/deot/vc/commit/01ca224235aafa969d080f625cafc8b938d55862))
- feat: dropdown, make MDropdown a mobile component with a full-width panel ([bf87781](https://github.com/deot/vc/commit/bf87781e5da2ad46ed2b17c7e8b1eb1482eda4ce))
- feat: dropdown, add caret and move sizes into local variables ([b711bcd](https://github.com/deot/vc/commit/b711bcd3fe2df0c1fd7690af9f0849f3c4c0e1a6))
- feat: index-bar, add IndexBar and MIndexBar with sticky group titles and a drag sidebar ([35fa71a](https://github.com/deot/vc/commit/35fa71ac4f913ab9303e78d1460b991ca3867c0d))
- feat: affix, expose getOffset / getScroller and run scroll handlers on size changes ([641d6e4](https://github.com/deot/vc/commit/641d6e4aba9b09a6aaead57e9276fdebded93e66))
- feat: rate, make MRate a mobile component with 750-design sizes ([df25028](https://github.com/deot/vc/commit/df25028ca290f55984556a407d47e052065be86b))
- feat: rate, pick by pointer position with drag, keyboard and readonly, gold by default ([7891372](https://github.com/deot/vc/commit/7891372ea8cf444f11d63a1c00497363ed8895a4))
- feat: timeline, make MTimeline a mobile component with 750-design sizes ([4b926fa](https://github.com/deot/vc/commit/4b926fa299107782862f3904593ab01aedc86bb1))
- feat: steps, make MSteps a mobile component with 750-design sizes ([7214a30](https://github.com/deot/vc/commit/7214a30689d618fb6bc06b1863f0c8662d1ade58))
- feat: select, add remote search to MSelect and MTreeSelect ([4ce90d5](https://github.com/deot/vc/commit/4ce90d5e28011c40660f530210fadab22409cf19))
- feat: tree, make MTreeSelect a mobile component with a bottom tree popup ([3a01170](https://github.com/deot/vc/commit/3a01170c81bfb8e38b8e9218c785f5d7762a17f9))
- feat: tree, make max limit the checked nodes like Select for Tree and TreeSelect ([ba343d7](https://github.com/deot/vc/commit/ba343d78f96245a7efa09eaf78845ce7ab9b99b5))
- feat: tree, make MTree a mobile component with 750-design sizes ([2e926da](https://github.com/deot/vc/commit/2e926da906079e5d4f0860d2e0a611590f441029))
- feat: select, let SelectList take the list component used when virtualized ([f5dbd8a](https://github.com/deot/vc/commit/f5dbd8a2bec9002af776a8fbb5c155348827b00a))
- feat: table, make MTable a mobile component with 750-design sizes and touch interactions ([c53fbc7](https://github.com/deot/vc/commit/c53fbc7e9aa6a83d005693ab04af8c5a6d9c5e0d))
- feat: popover, let useHoverPopover take the method that opens the popover ([cad73f7](https://github.com/deot/vc/commit/cad73f7948f127d01485d73092f6a65c746aea76))
- feat: file-preview, pass mobile to the global enhancer and renderSlide ([256f6ca](https://github.com/deot/vc/commit/256f6ca7d35f85333dbbaf9fb8a88f7b08ae972d))
- feat: recycle-list, make MRecycleList a mobile component with 750-design gap and estimateSize ([59db600](https://github.com/deot/vc/commit/59db60051931897f1b7250721536f71645250832))
- feat: scroller, make MScroller a mobile component with an indicator-only always bar ([eaedc68](https://github.com/deot/vc/commit/eaedc68012bb005ca793ad6b42ca6a6da4e9602d))
- feat: select, add MSelectView, MSelect and MSelect.open for mobile ([deb97c1](https://github.com/deot/vc/commit/deb97c1dbf3fb3b9b8be033195106597c5b9fefc))
- feat: picker, replace showToolbar with confirm top|bottom|false across mobile pickers ([13395a8](https://github.com/deot/vc/commit/13395a8d1b5dda8a0822b685cea02da49b75d5ef))
- feat: select, limit the number of selections by max and treat 0 as unlimited ([2628668](https://github.com/deot/vc/commit/26286687f191a755ba1c64e325d7d9345ca68e66))
- feat: cascader, add MCascaderView, MCascader and MCascader.open for mobile ([e605d19](https://github.com/deot/vc/commit/e605d19fc72684216b012634c210b68ed490f8b1))
- feat: cascader, pass { row, values, labels } to loadData ([97d4a9f](https://github.com/deot/vc/commit/97d4a9f71d3e48069c5cc0e9542c57f72f19aef0))
- feat: picker, add cancelDisabled / okDisabled and show the title in the popup header without the toolbar ([af47fbf](https://github.com/deot/vc/commit/af47fbf99f4e1cd2aed6df5ae903112cbfaacb94))
- feat: tabs, swipe between MTabs panes and expose the mobile tab bar as local variables ([30ae4a8](https://github.com/deot/vc/commit/30ae4a859f3656549ed03a11401ba49d71b455b2))
- feat: upload-picker, pick every type from one entry, keep one ordered list and add retry and progress ([525793e](https://github.com/deot/vc/commit/525793e6f2ed30738ed63dea0925c7ecd344ae16))
- feat: file-preview, share row and tile items with UploadPicker, lay files out as list, grid or group, and add a mobile viewer ([40aa94c](https://github.com/deot/vc/commit/40aa94c84905dc36cd909d43a53643258888eabd))
- feat: divider, draw the line with pseudo elements, add MDivider in 750 units and a dashed prop ([604d4a7](https://github.com/deot/vc/commit/604d4a734b95ffcf8d642a63f5b9f89ed2f542b3))
- feat: modal, resize MModal in 750 units, add disabled buttons and content class props, and zoom in from half size ([9210b0b](https://github.com/deot/vc/commit/9210b0b1257ece546421ebf43cc0f478a832f2a2))
- feat: date-picker, align MDatePicker types and limits with the desktop and add range selection ([101c1c9](https://github.com/deot/vc/commit/101c1c922a1160b44e02431033dad7f60821c5e5))
- feat: picker, gray out disabled rows and settle on the nearest enabled one ([acccdb9](https://github.com/deot/vc/commit/acccdb9247251c0a870c4eacf79f93e18b74f29b))
- feat: picker, resize the wheel to 44px rows with one mask and add tap, momentum and wheel gestures ([3ad5554](https://github.com/deot/vc/commit/3ad5554562799c1110ef996b2c47df43f34d82e5))
- feat: modal, keep touch scrolling inside MModal with useScrollContain ([f68554d](https://github.com/deot/vc/commit/f68554da2110d71d80bcb4487e4f3289d0ec7514))
- feat: popup, add snaps and v-model:snap for a sheet that pulls up from a default height to full screen ([f36bfdb](https://github.com/deot/vc/commit/f36bfdb93d05cb3a739316b170e5e34ce71e3e00))
- feat: popup, restyle MPopup in 750 units and add title, content, swipeClosable and MPopup.open ([437d77d](https://github.com/deot/vc/commit/437d77dea060813555e464e00d4122fc04574cc8))
- feat: drawer, modal, emit visible-change on open and accept CSS lengths for the Drawer size ([33eaa0d](https://github.com/deot/vc/commit/33eaa0dfdc764c1ae42ac9589be8f1d63db0e53e))
- feat: textarea, restyle MTextarea in 750 units, add its indicator and fix the desktop hover, counter space and bytes count ([a3be146](https://github.com/deot/vc/commit/a3be1468ec2e48d2a46e11a382074cfa6a4b75fd))
- feat: input, restyle MInput, MInputNumber and MInputSearch in 750 units and add theme and shape ([71fbc75](https://github.com/deot/vc/commit/71fbc75b0e699d759eca960fb275bc690567779b))
- feat: slider, make MSlider a real mobile component and fix the tooltip and hit area on touch ([45e919d](https://github.com/deot/vc/commit/45e919de7beec2de8ca3737cbea1fd3d80ddb59b))
- feat: popover, give MPopover a mobile look and redraw the arrow flush with the panel ([141cc1b](https://github.com/deot/vc/commit/141cc1b57ed0f457d7647172d6391f822b83d599))
- feat: switch, restyle MSwitch as an iOS switch, widen the track with its text and add keyboard support ([f037fd4](https://github.com/deot/vc/commit/f037fd41021b855165053d354005801eef91e3ff))
- feat: card, make MCard a real mobile component and place extra beside the title ([d4d4507](https://github.com/deot/vc/commit/d4d4507a53a000b2800a8037048b25eaeb2b05c0))
- feat: checkbox, add type and size to CheckboxGroup and MCheckboxGroup ([ed57808](https://github.com/deot/vc/commit/ed578082942cd044e3afe0b27a960177754f7180))
- feat: radio, support type and size on MRadioGroup and make MRadioButton a real component ([3f4e2bf](https://github.com/deot/vc/commit/3f4e2bf23dcde068a37acf40f390ae060a9d305a))
- feat: checkbox, add shape and group disabled, max, vertical and icon slot ([a84246f](https://github.com/deot/vc/commit/a84246f0c69b58a05824d9e6619a5f0276972247))
- feat: collapse, add MCollapse and MCollapseItem with sizes in 750 units ([4c37ada](https://github.com/deot/vc/commit/4c37ada8abb8bc091ca04352706ec44f62343ee3))
- feat: form, restyle MForm with sizes in 750 units and add errorLayout ([c2881a8](https://github.com/deot/vc/commit/c2881a85ed42f6c30f0cd7ffadec7a99e1f4fd9a))
- feat: list, restyle MListItem with sizes in 750 units and add description, icon, header and footer ([a1148f9](https://github.com/deot/vc/commit/a1148f97a005371b46d9142275c4cc181f79c3b2))
- feat: pagination, add MPagination as a standalone mobile component ([b9ab6f5](https://github.com/deot/vc/commit/b9ab6f5f10575c91d6baea70cecacd2b42868a43))
- feat: tag, add MTag with sizes in 750 units ([2641bc7](https://github.com/deot/vc/commit/2641bc75ae2b29f997ee6e328a467a688ed9ae9b))
- feat: button, add MButton with sizes in 750 units and a mini size ([7464860](https://github.com/deot/vc/commit/746486065e485b83374ec21f96e308f2fe46bf05))
- feat: badge, add MBadge with sizes in 750 units ([15d4ece](https://github.com/deot/vc/commit/15d4ecee6457bc543b1e30a7f0c1e3cdf1297f2e))
- feat: icon, add MIcon with size in 750 units ([f5d4fd6](https://github.com/deot/vc/commit/f5d4fd6c35c3c7f2625177f9b9bc199a479f777f))
- feat: tabs, pin the MTabs bar with MAffix sticky ([52d19e6](https://github.com/deot/vc/commit/52d19e63b7cca0145456c497872ea6bb40046f13))
- feat: affix, add MAffix and accept CSS length strings for offset ([0c71733](https://github.com/deot/vc/commit/0c717331634542df15220710b4217735a2c80907))
- feat: spin, render MSpin as Spin with a vcm-spin marker and accept CSS lengths for size ([8c87ab8](https://github.com/deot/vc/commit/8c87ab83724341a870a341cb0461a6f64c750844))
- feat: style, add localfix and localvars so mobile components override sizes by variables ([a95d15f](https://github.com/deot/vc/commit/a95d15f0d8a64977635d6ea981c8c982753e1c59))
- feat: mobile, read numeric length props in 750 units ([3f378bf](https://github.com/deot/vc/commit/3f378bfc8e64b646cad8c3532191e88bb8074032))
- feat: spin, add MSpin with size in 750 units ([ca8d954](https://github.com/deot/vc/commit/ca8d954cdd9ec5e593bdd7b05d68f0cd775622f4))
- feat: style, add --vc-rem and remfix for viewport-scaled mobile sizes ([2745ae9](https://github.com/deot/vc/commit/2745ae9c5cc2ac2a41ca7e5968f17fdec0bbc318))
- feat: file-preview, open and download data urls in the file slide ([d6e1b72](https://github.com/deot/vc/commit/d6e1b72f5513de5836f5f7fca2b4addf9ef28c17))
- feat: scroller, add axis and animated scrollTo with a shared wheel handler ([2a6994f](https://github.com/deot/vc/commit/2a6994fd65f06d36e6412782fc1bfefdccb6c3a8))
- feat: select, add clearSearchOnSelect to clear the keyword after a multi-select pick ([43301da](https://github.com/deot/vc/commit/43301da90ad12bb1621505e0cf949ac189a62b28))
- feat(hooks): use-gesture, pass the pressed target to moveStart ([f1c961f](https://github.com/deot/vc/commit/f1c961fbcfa18f5d733a4dfefd0b6577f388a5fc))
- feat(hooks): useRem, share the px value of one 750-design unit ([86f4988](https://github.com/deot/vc/commit/86f4988354d2d94b229e4b1b259b1fe3b1cdf06b))
- feat(hooks): use-scroll-contain, export DRAG_IGNORE, isScroller and canScrollToward ([dd5d33a](https://github.com/deot/vc/commit/dd5d33aa78b2ee97afee236f848836ee3e37416f))
- feat(hooks): use-scroll-contain, keep touch scrolling inside overlays and let callers claim the gesture ([b5b0f33](https://github.com/deot/vc/commit/b5b0f33b2ebb453e0aad17172b6da1b92aab9017))
- feat(shared): length, add toPx and toRem and move remToPx out of Utils ([c4a2617](https://github.com/deot/vc/commit/c4a261701eb1d8d94f27aaa282cc986903484c9d))
- feat(shared): utils, add remToPx to convert 750-unit lengths to px ([b67512b](https://github.com/deot/vc/commit/b67512b39e552b0724cc51a584b9217c14636f96))
- feat(locale): color-picker, add placeholder and clearText for MColorPicker ([e544cb3](https://github.com/deot/vc/commit/e544cb3ec26e5a8172348a7a8c337b99d1fec9e2))

### Updates

- style: table, use the modern Sass if() syntax in the mobile styles ([e746a69](https://github.com/deot/vc/commit/e746a693ef2ed373277c9246b35d1edccd148361))
- style: pagination, lighten the active and hover page background ([88ced64](https://github.com/deot/vc/commit/88ced64b92071f342a3f204c08f589cc76f860fd))
- style: tree, show the focus background only on keyboard focus ([3fe3184](https://github.com/deot/vc/commit/3fe318427ca4c7da3ec6ad7e9f1b116487a83748))
- refactor: date-picker, move date handling onto a dayjs-compatible API ([2ca44ba](https://github.com/deot/vc/commit/2ca44bae415b1ce9de3bf7f2eb0464b1439de3d4))
- perf: affix, emit v-model only when the pinned state changes ([8ad2463](https://github.com/deot/vc/commit/8ad246309326387ae2cebe37cdbd956fd2ddb16f))
- refactor: back-top, track the scroll container through a shared useCarrierArea ([0d15dd8](https://github.com/deot/vc/commit/0d15dd80fa8c760d89dbd15326c413abfc6dbdf9))
- refactor: select, popover, input, share option rows and host emits, position popovers by the visible viewport ([2dd87a1](https://github.com/deot/vc/commit/2dd87a1b62816798eb554f932d0dd0f22ed9a807))
- chore: icon, update the icon font with the editor toolbar icons ([cf91345](https://github.com/deot/vc/commit/cf91345eaa3faaadf03ab21b7aa56768bc92513d))
- refactor: image-processor, keep image loading helpers in its own utils ([f0f4881](https://github.com/deot/vc/commit/f0f4881ee88da50b710fa4a17f54922eee920b70))
- refactor: index-bar, move the sticky title calculation into scroller/core/sticky ([ad72dbe](https://github.com/deot/vc/commit/ad72dbe0106ab421feb84525951de8d7ebdc4797))
- refactor: color-picker, move the view setup into useColorPickerView and the value input into useColorInput, write part sizes as local variables ([eea88c7](https://github.com/deot/vc/commit/eea88c7ff7180da7757c657158a3b0aae0dcb4e7))
- style: color-picker, group the parts into sub-folders ([ffafc18](https://github.com/deot/vc/commit/ffafc1849d1174bc80ff6794ae9b6e9849b11b29))
- refactor: dropdown, move the Dropdown and DropdownItem setup into useDropdown / useDropdownItem ([238a785](https://github.com/deot/vc/commit/238a785f6e7f0c34ed378d5e6fca079d1dd274e2))
- refactor: rate, move the Rate setup into useRate ([6b504a4](https://github.com/deot/vc/commit/6b504a4176ff4a4985cb35a7c4758da52617cf9d))
- refactor: timeline, move the Timeline setup into useTimeline ([e416325](https://github.com/deot/vc/commit/e4163256088d0387251346e0e745b8ad0feb269e))
- refactor: steps, move the Steps setup into useSteps ([a937943](https://github.com/deot/vc/commit/a9379434fe59988556ddf441179faae84959d4a5))
- refactor: tree-select, share the selected value logic, the content and the summary bar with mobile ([bd9b08e](https://github.com/deot/vc/commit/bd9b08ec8ec41f7718c0c41047dc1377b5e47096))
- refactor: tree, group the files into sub-folders like table ([c751ebc](https://github.com/deot/vc/commit/c751ebc592f5b2e2004b6708d8ee5fa4066a2bb9))
- style: tree, turn the node sizes into local variables ([ddd4fb2](https://github.com/deot/vc/commit/ddd4fb2155881a66f30f9c4156e5307ff208a5f5))
- refactor: tree, move the component file to use-tree.tsx ([ec17c30](https://github.com/deot/vc/commit/ec17c30a1769d3bdcb7bebd4251803e1527ae766))
- refactor: table, move the component file to hooks/use-table.tsx ([3b0b4bd](https://github.com/deot/vc/commit/3b0b4bd52afca2d9c2d7af3c8b677625bb7833ed))
- style: table, turn the cell sizes into local variables ([1d902f2](https://github.com/deot/vc/commit/1d902f2e2406ee901d2663338f4da20f67010e37))
- refactor: table, share the filter value logic through useTableFilter ([04ae4aa](https://github.com/deot/vc/commit/04ae4aac2f844854abaac7b8161cc0801a3d9d3a))
- refactor: recycle-list, take the pull-to-refresh distance from the indicator's own size ([7ea52a4](https://github.com/deot/vc/commit/7ea52a4c4e6dde774fe8d6272a1a98e08931ba1b))
- style: scroller, group the scroller files into hooks, scroller-bar and core folders ([3fbdb82](https://github.com/deot/vc/commit/3fbdb821a655ac4401473c57e9a949d44b6df40b))
- refactor: select, share the mobile option list styles and center the selected option with one helper ([dd98366](https://github.com/deot/vc/commit/dd98366b6d5ddec483ec5b2d269b3b092eae7816))
- refactor: picker, share the popup core, trigger and open across mobile pickers ([634e125](https://github.com/deot/vc/commit/634e1255e5de5abe1a47088de3785903091ee8cd))
- refactor: popup, build the touch handling on useScrollContain and trim the snaps and drag code ([6ef101c](https://github.com/deot/vc/commit/6ef101c7efb50a8964c30eecad561123e05821c9))
- style: checkbox, radio, restyle MCheckbox and MRadio with sizes in 750 units ([d930024](https://github.com/deot/vc/commit/d930024a9009e4247a8cdae78f895e19bdaf45da))
- style: checkbox, radio, button, rename the fragment prop of groups to styleless ([6401e4c](https://github.com/deot/vc/commit/6401e4c05d7389cbed1856582f024d62fdcd8bfb))
- refactor: hooks, take (props, context, options) in component hooks ([a4f7327](https://github.com/deot/vc/commit/a4f732763e9606852093f56067a3348d795a4e24))
- style: upload-picker, picker, keep mobile styles under mobile/ ([465fd68](https://github.com/deot/vc/commit/465fd68f3c4357b223757ef94bd81c7b2e60fd4a))
- refactor: style, use the helpers and common mixins of @deot/style 1.3.2 ([d76bde8](https://github.com/deot/vc/commit/d76bde80cdc36ba14cdead7b7d082d1f8d5b0a34))
- perf: carousel, put the gap into the transform calc instead of reading --vc-rem ([6e90538](https://github.com/deot/vc/commit/6e90538690a1b2eed42c41cd94d6516961d0aa01))
- style: mobile, scale sizes with --vc-rem through remfix ([e1c39e0](https://github.com/deot/vc/commit/e1c39e0e1809111ba660554a0436dedb01c8ece1))
- style: tour, split the open/close flow and track async operations with one task ([d130ae0](https://github.com/deot/vc/commit/d130ae060db2b0dce9c90e16039bdc3edbc434db))
- style: radio, tabs, share one segmented look for button, capsule, text and round ([2aff131](https://github.com/deot/vc/commit/2aff1319a1ddd389506587c665089681d28d2d45))
- style: tabs, scroll the bar through Scroller axis and move MTabs onto Scroller ([af454fa](https://github.com/deot/vc/commit/af454faa772275b99149c782f398b22c2d7b84ca))
- style: table, time-select, reuse the Scroller wheel handler and animated scrollTo ([01f5efe](https://github.com/deot/vc/commit/01f5efe14888ec7587a850adb8e5d4a7fbac1381))
- refactor(locale): color-picker, drop the unused clearText ([fe11b69](https://github.com/deot/vc/commit/fe11b697fed5aa76e5a195d9512f88d1c0a9cce2))

## v1.2.6

_2026-11-02_

### Bugfixes

- fix: button, use the primary color for text buttons and separate grouped buttons ([045b68d](https://github.com/deot/vc/commit/045b68d1d5c772a4a8725ee9b7ddb857d2ee2e98))
- fix: radio, keep the joined button group at 32px including borders ([eaba3a5](https://github.com/deot/vc/commit/eaba3a5430ecbb4f287cd64362ec9cc0c98d7619))
- fix: file-preview, zoom unsized images to their own ratio once the size arrives ([2dd0364](https://github.com/deot/vc/commit/2dd036442e20a82f0facf8e47b34f9f368f8360d))
- fix: file-preview, zoom from the whole button like Modal and let Image pass itself ([a7636ac](https://github.com/deot/vc/commit/a7636ac043b8d276afd840265d73a8f29c9851e9))
- fix: portal, release props and callbacks of a destroyed leaf that is still held ([ab602d3](https://github.com/deot/vc/commit/ab602d3db551b0626cfad857249217ac6dcb98c0))
- fix: vc, open from the clicked element even when the popup opens after a request ([1fae95e](https://github.com/deot/vc/commit/1fae95e487a1718913e5a93cc138075453ce345e))
- fix: transition, close back to where the trigger was when it is gone ([e9d9bee](https://github.com/deot/vc/commit/e9d9bee25d7ee42b791c9ba659ec4ed6330a8625))

### Features

- feat: tabs, add type/size/placement/stepper, alive/lazy, scroller overflow and axis-aware animation ([d6bcc55](https://github.com/deot/vc/commit/d6bcc5512a76f5bc124e9a8468cd6db899b1d95f))
- feat: slider, add multiple thumbs, segments, marks, ticks, vertical/inverted, keyboard and size params ([c2be645](https://github.com/deot/vc/commit/c2be645be24019fbc2a557d5962595a4bcaa70f0))
- feat: collapse, add default styles, extra slot, border/disabled/arrow/collapsible and style props ([3b86189](https://github.com/deot/vc/commit/3b861891df8f195e36f1e5b87530bab1ce1fd389))
- feat: radio, add button/card/capsule/text/round group types and four sizes ([aa4b933](https://github.com/deot/vc/commit/aa4b933d4bfbfbd1b1a04c063d410c0a97c986da))
- feat: file-preview, add placeholder and show loading while the opened item is not ready ([39b0423](https://github.com/deot/vc/commit/39b04235620ff858030348aaa1aeaef6ffe7c51a))
- feat: vc, open popups from a VirtualElement measured when they open ([db6a4fe](https://github.com/deot/vc/commit/db6a4fe8910202d444f717957abc4630f9c3cba6))
- feat: clipboard, write several formats at once with a MIME map ([799d0c5](https://github.com/deot/vc/commit/799d0c5824cd1431f543183ad04dfe0eb8627cd2))
- feat: file-preview, add triggerElement to open and ImagePreview.open ([7f42619](https://github.com/deot/vc/commit/7f42619c5babcb6697287f0116bc0d46c068211d))
- feat: modal, add triggerElement to choose where it opens from ([7d7f43d](https://github.com/deot/vc/commit/7d7f43d6335ab2793a0b6f84e9171d1b47bd4aaa))

### Updates

- style: carousel, fix stylelint errors in the examples ([394c99b](https://github.com/deot/vc/commit/394c99bea5540a01caa9836959749228e51b880e))
- style: alert, refine layout, text colors and sizes ([9246abe](https://github.com/deot/vc/commit/9246abe3de55fa1c0252e31e42628dfb07045a6d))
- style: fix stylelint errors in the form, radio and theme examples ([dda6f9e](https://github.com/deot/vc/commit/dda6f9e2f52cecd60876a09fe4db379c24096b2b))
- style: transition, group each transition into its own folder ([6f214b1](https://github.com/deot/vc/commit/6f214b1de7afb682738c072e85cf601858c726c4))

## v1.2.5

_2026-10-30_

### Bugfixes

- fix: text, count laid-out lines instead of dividing height by line-height ([eab6e5c](https://github.com/deot/vc/commit/eab6e5c5a518eec101d686a8a09b76e056ae2259))

### Features

- feat: tree, match values strictly with a Map and align picker and checkbox group ([4c0c2b3](https://github.com/deot/vc/commit/4c0c2b3f91e2ac7c9629cbcfb2968a43c3e48968))
- feat: cascader, match values strictly and let numerable convert arrays and scalars ([624e15e](https://github.com/deot/vc/commit/624e15e7e6383555660192ca9d8ab23a4f4cb7b0))
- feat: cascader, add checkStrategy to keep only the last level in v-model ([66c1f15](https://github.com/deot/vc/commit/66c1f15533c0265cb3fb09822ff797bbe391f1be))
- feat: form, align labels to the widest one with labelWidth auto ([7a70530](https://github.com/deot/vc/commit/7a70530a81a985781086af418fc67fa97158b040))
- feat: descriptions, add Descriptions with themes, built-in value types and a global renderValue hook ([4980d90](https://github.com/deot/vc/commit/4980d900e8d5c37328faca970aa69834864f1446))
- feat: grid, add Grid and GridItem with track templates, responsive values and getSpan ([1df1da7](https://github.com/deot/vc/commit/1df1da77da456974692fd372f9c9e8b23905889c))
- feat: text, expand and collapse the full text through an expand slot ([2cf8a2e](https://github.com/deot/vc/commit/2cf8a2ee3fbefce7cabe658c412ab13650b29738))
- feat: transition, cap the auto start and keep a minimum duration for reveal ([6921121](https://github.com/deot/vc/commit/69211216d1037431090a3b99b44099cfdf587e39))

### Updates

- style: form, share getLabelWidth with descriptions ([fd10de7](https://github.com/deot/vc/commit/fd10de7ed856df6a278a86fc68d295f154eecdde))
- style: file-preview, export allowedUrl for other components ([68e5612](https://github.com/deot/vc/commit/68e5612f4c5c2f50f10d782e23b975db84fe300e))
- style: share getChildren to flatten fragment children ([77cb7f7](https://github.com/deot/vc/commit/77cb7f7c9d445866b0ab06bea4ee3ac5b894c280))
- chore(shared): force-publish `1.2.4` -> `1.2.5`

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
