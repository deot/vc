[ci-image]: https://github.com/deot/vc/actions/workflows/ci.yml/badge.svg?branch=main
[ci-url]: https://github.com/deot/vc/actions/workflows/ci.yml

[![build status][ci-image]][ci-url]

# deot/vc

用于Web开发的组件库, 且遵守`tree-shaking`

## Monorepo

// TODO

## Contributing

这是一个[monorepo](https://en.wikipedia.org/wiki/Monorepo)仓库 ，使用[pnpm](https://pnpm.io/) 管理

- 安装环境

```console
$ npm run init
```

- 添加依赖或添加新的包

```console
$ npm run add
```

- 关联

```console
$ npm run link
```

- 测试

```console
$ npm run test

# 或者 直接添加参数
$ npm run test -- --package-name '**' --watch
```

- 开发

```console
$ npm run dev

# 或者 直接添加参数
$ npm run dev -- --package-name '**'
```

- 打包

```console
$ npm run build
```

- 代码检查

```console
$ npm run lint
```

- 发布

```console
$ npm run pub
```

## 关联

[CONTRIBUTING](./.github/CONTRIBUTING.md)

[LICENSE (MIT)](./LICENSE)