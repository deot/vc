[ci-image]: https://github.com/deot/vc/actions/workflows/ci.yml/badge.svg?branch=main
[ci-url]: https://github.com/deot/vc/actions/workflows/ci.yml

[![build status][ci-image]][ci-url]

# @deot/vc

面向 Vue 3 的桌面端与移动端组件库，支持按需引入和 `tree-shaking`。

## 安装

```bash
pnpm add @deot/vc vue
```

```ts
import { Button } from '@deot/vc';
```

## Monorepo

- [`@deot/vc`](./packages/index) - 聚合入口。
- [`@deot/vc-components`](./packages/components) - 桌面端与移动端组件。
- [`@deot/vc-hooks`](./packages/hooks) - Vue 组合式工具。
- [`@deot/vc-locale`](./packages/locale) - 内置语言与语言类型。
- [`@deot/vc-shared`](./packages/shared) - 包间共享能力。

## Contributing

This is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) managed with [pnpm](https://pnpm.io/).

- Setup

```console
$ npm run init
```

- Add dependencies or new packages

```console
$ npm run add
```

- Link

```console
$ npm run link
```

- Test

```console
$ npm run test

# Or pass arguments directly
$ npm run test -- --package-name '**' --watch
```

- Development

```console
$ npm run dev

# Or pass arguments directly
$ npm run dev -- --package-name '**'
```

- Documentation

```console
$ npm run docs:dev
```

- Build

```console
$ npm run build
```

- Lint

```console
$ npm run lint
```

- Publish

```console
$ npm run pub
```

## Links

[CONTRIBUTING](./.github/CONTRIBUTING.md)

[LICENSE (MIT)](./LICENSE)
