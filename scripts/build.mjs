/* global $ */

import fs from 'fs-extra'

await (async () => {
  const { argv } = process
  const target = argv[3]
  const validTargets = ['release-vercel', 'release-ci', 'surge']

  if (!validTargets.includes(target)) {
    throw new Error('Invalid build target.')
  }

  await $`yarn verify-translation`
  await clean()
  console.info('🚧  Build artifact')

  switch (target) {
    case 'release-vercel':
      process.env.NODE_ENV = 'production'
      process.env.REACT_APP_USE_SW = 'true'
      await $`craco build`

      break

    case 'release-ci':
      process.env.NODE_ENV = 'production'
      process.env.REACT_APP_SHOW_AD = 'true'
      process.env.REACT_APP_HASH_ROUTER = 'true'
      process.env.REACT_APP_USE_SW = 'true'
      process.env.PUBLIC_URL = getUrlPathPrefix()
      await $`craco build`
      await changeManifest({
        start_url: `${getUrlPathPrefix()}/#/home`,
      })
      await bundleArtifact()

      break

    case 'surge':
      process.env.NODE_ENV = 'production'
      process.env.REACT_APP_HASH_ROUTER = 'true'
      process.env.REACT_APP_RUN_IN_SURGE = 'true'
      process.env.REACT_APP_URL_PATH_PREFIX = '/web'
      process.env.PUBLIC_URL = getUrlPathPrefix()
      await $`craco build`
      await changeManifest({
        short_name: 'Dashboard',
        name: 'Surge Web Dashboard',
        start_url: `${getUrlPathPrefix()}/index.html#/home`,
      })
      await bundleArtifact()
      await $`mv ./build.tar.gz ./yasd.tar.gz`

      break

    default:
      process.env.NODE_ENV = 'production'
      process.env.REACT_APP_USE_SW = 'true'
      process.env.PUBLIC_URL = getUrlPathPrefix()
      await $`craco build`

      if ('REACT_APP_HASH_ROUTER' in process.env) {
        await changeManifest({
          start_url: `${getUrlPathPrefix()}/#/home`,
        })
      }
  }
})()

async function changeManifest(obj = {}) {
  const manifest = await fs.readJson('build/manifest.json')

  await fs.writeJSON(
    'build/manifest.json',
    {
      ...manifest,
      ...obj,
    },
    { spaces: 2 },
  )
}

async function bundleArtifact() {
  await $`(cd ./build; tar -czf ../build.tar.gz ./)`
}

async function clean() {
  console.info('🧹  Clean up')
  await $`rm -r ./build`
  await $`rm -r ./*.tar.gz`
}

function getUrlPathPrefix() {
  return 'REACT_APP_URL_PATH_PREFIX' in process.env
    ? process.env.REACT_APP_URL_PATH_PREFIX
    : ''
}
