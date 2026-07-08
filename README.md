[ci-image]: https://github.com/deot/vc/actions/workflows/ci.yml/badge.svg?branch=main
[ci-url]: https://github.com/deot/vc/actions/workflows/ci.yml

[![build status][ci-image]][ci-url]

# deot/vc

A component library for web development with `tree-shaking` support.

## Monorepo

// TODO

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
