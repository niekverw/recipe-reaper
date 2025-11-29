import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const steps = [
  'Download or copy the contents of the chrome-extension folder from GitHub.',
  'Open chrome://extensions in Chrome and enable Developer Mode.',
  'Click “Load unpacked” and select the chrome-extension folder.',
  'Pin the “Reap this recipe” extension and click it whenever you want to send the current page into Recipe Reaper.'
]

const bookmarkletHref = "javascript:(function(){const target='https://recipereaper.app/add-recipe?url='+encodeURIComponent(window.location.href);window.open(target,'_blank');})();"

function AboutPage() {
  const bookmarkletLinkRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    if (bookmarkletLinkRef.current) {
      bookmarkletLinkRef.current.setAttribute('href', bookmarkletHref)
    }
  }, [])

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">About & Tools</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">
          I made this app because most recipe apps I tried were overloaded with features, lacked user-friendliness (too many clicks just to add a recipe), and struggled with parsing recipe descriptions. I wanted something simple, intuitive, and fun—an app that works the way I want.
        </p>
      </div>

      <section className="rounded-2xl border border-blue-200 bg-white/80 p-6 shadow-sm dark:border-blue-900/40 dark:bg-gray-900/40 backdrop-blur">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Bookmarklet (Works in Any Browser)</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          The quickest way to “reap” a recipe is this bookmarklet. Drag the button below to your bookmarks bar (or create a bookmark and paste the code). Whenever you hit a tasty page, click the bookmark and Recipe Reaper opens the Add Recipe screen with the URL already filled in.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            ref={bookmarkletLinkRef}
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            Reap this recipe (bookmarklet)
          </a>
          <code className="text-xs bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200 overflow-x-auto">
            {bookmarkletHref}
          </code>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Tip: Right-click the button → “Bookmark Link”, or drag it to your bookmarks bar.</p>
      </section>

      <section className="rounded-2xl border border-violet-200 bg-white/80 p-6 shadow-sm dark:border-violet-900/40 dark:bg-gray-900/40 backdrop-blur">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Install the Chrome Extension</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Prefer a Chrome toolbar button? The extension adds a “Reap this recipe” button that launches the Add Recipe screen and auto-imports the current tab. Install it in a minute:
        </p>
        <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-200 list-decimal list-inside">
          {steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
        <div className="mt-4 inline-flex flex-wrap gap-3">
          <a
            href="https://github.com/niekverw/recipe-reaper/tree/master/chrome-extension"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-violet-300 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-200 dark:hover:bg-violet-900/40"
          >
            View extension folder
          </a>
          <a
            href="/extensions/chrome-extension.zip"
            download
            className="inline-flex items-center gap-2 rounded-full border border-violet-500 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100 dark:border-violet-400 dark:bg-violet-900/40 dark:text-violet-100"
          >
            Download chrome-extension zip
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/60 backdrop-blur">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Contribute on GitHub</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Recipe Reaper is fully open-source. Browse the code, file issues, and send pull requests.
        </p>
        <a
          href="https://github.com/niekverw/recipe-reaper/tree/master"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900"
        >
          Visit GitHub repository
        </a>
      </section>

      <div className="text-center">
        <Link
          to="/"
          className="text-sm font-medium text-violet-600 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-100"
        >
          ← Back to recipes
        </Link>
      </div>
    </div>
  )
}

export default AboutPage