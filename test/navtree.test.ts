/**
 * @jest-environment jsdom
 */

// The sidebar's "you are here". It is written in the template rather than in the browser, so
// these are the cases where a page and its own nav entry are spelled differently: the home page,
// whose nav url is empty while poops hands the layout `index.html`; a section index, which can
// arrive with a trailing slash the nav does not carry; and an ordinary leaf, which matches
// outright. The mark has to be exactly one link, or a screen reader is told two pages are
// current.
//
// Deliberately not covered here: the nesting `navtree` writes and the `<details>` around a
// section, which the docs build and the axe sweep assert on the real site, and the scroll that
// brings the marked link into view, which is docs.ts and is tested in docs.test.ts.

import * as path from 'node:path'

// No `@types/nunjucks` in the tree, and none is worth adding for four lines — `require` gives
// `any`, which is what a template renderer returns anyway.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nunjucks = require('nunjucks')

// `autoescape: false` is poops' own default, not a shortcut taken here — the template escapes
// what it interpolates itself, and the TOC arrives as a `SafeString`. An env that autoescaped
// would pass these tests while the real one rendered something else.
const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(path.join(__dirname, '..')),
  { autoescape: false }
)

// The shape poops writes into nav.json: an empty url for the home page, a bare directory for a
// section that has a page of its own, and a file for a leaf.
const NAV = [
  { title: 'Home', url: '' },
  { title: 'Elementals', url: 'elementals', children: [{ title: 'Accordion', url: 'elementals/accordion.html' }] },
  { title: 'My index', url: 'my-index.html' }
]

function render(pageUrl: string): Document {
  const html = env.renderString(
    '{% import "navtree.html" as nav %}{{ nav.navtree(items, pageUrl, prefix, toc) }}',
    { items: NAV, pageUrl, prefix: '', toc: '' }
  ) as string
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
}

const current = (doc: Document): string[] =>
  Array.from(doc.querySelectorAll('a.nav-link.active')).map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? '')

test('the page whose url is the one in the nav is the page marked current', () => {
  expect(current(render('elementals/accordion.html'))).toEqual(['elementals/accordion.html'])
})

test('the home page finds itself, though the nav calls it nothing and the layout calls it index.html', () => {
  expect(current(render('index.html'))).toEqual([''])
  expect(current(render(''))).toEqual([''])
})

test('a section index matches its own entry whether or not it arrives with a trailing slash', () => {
  expect(current(render('elementals'))).toEqual(['elementals'])
  expect(current(render('elementals/'))).toEqual(['elementals'])
})

test('a page called my-index.html keeps its name: only a real index.html is the directory it sits in', () => {
  expect(current(render('my-index.html'))).toEqual(['my-index.html'])
  expect(current(render('my'))).toEqual([])
})

test('a page that is not in the nav leaves every link alone', () => {
  expect(current(render('elsewhere.html'))).toEqual([])
})

test('the mark is an attribute and not only a colour, and it is on one link at a time', () => {
  const doc = render('elementals/accordion.html')
  const marked = doc.querySelectorAll('[aria-current="page"]')
  expect(marked).toHaveLength(1)
  expect(marked[0].getAttribute('href')).toBe('elementals/accordion.html')
  expect(marked[0].classList.contains('active')).toBe(true)
})

test('the table of contents goes under the current page and nowhere else', () => {
  const html = env.renderString(
    '{% import "navtree.html" as nav %}{{ nav.navtree(items, pageUrl, prefix, toc) }}',
    { items: NAV, pageUrl: 'elementals', prefix: '', toc: '<nav class="toc"></nav>' }
  ) as string
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const tocs = doc.querySelectorAll('.toc')
  expect(tocs).toHaveLength(1)
  expect(tocs[0].previousElementSibling!.classList.contains('active')).toBe(true)
})
