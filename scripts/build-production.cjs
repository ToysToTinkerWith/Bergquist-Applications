const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const root = fs.realpathSync(path.resolve(__dirname, ".."))
const stage = path.join(root, ".next-production-stage")
const functions = path.join(root, "functions")
const destination = path.join(functions, ".next")

// Build outside functions/ so Node cannot resolve a second React installation.
for (const name of ["next", "react", "react-dom"]) {
  const appVersion = require(path.join(root, "node_modules", name, "package.json")).version
  const runtimeVersion = require(path.join(functions, "package-lock.json")).packages[`node_modules/${name}`]?.version
  if (appVersion !== runtimeVersion) throw new Error(`${name}: build ${appVersion} does not match deployment ${runtimeVersion}`)
}
const build = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
  cwd: root, stdio: "inherit", env: { ...process.env, NEXT_BUILD_DIR: path.basename(stage), NODE_ENV: "production" },
})
if (build.error) throw build.error
if (build.status !== 0) process.exit(build.status || 1)
if (!fs.existsSync(path.join(stage, "BUILD_ID"))) throw new Error("Production build is incomplete")

// Replace only the generated artifact inside this project's real functions folder.
if (fs.realpathSync(functions) !== functions || path.relative(root, destination) !== path.join("functions", ".next")) {
  throw new Error("Unexpected deployment artifact path")
}
if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) throw new Error("Deployment artifact must not be a link")
fs.rmSync(destination, { recursive: true, force: true })
fs.mkdirSync(destination)
for (const entry of fs.readdirSync(stage)) {
  if (entry !== "cache") fs.cpSync(path.join(stage, entry), path.join(destination, entry), { recursive: true })
}
console.log(`Staged production build ${fs.readFileSync(path.join(destination, "BUILD_ID"), "utf8").trim()}`)
require('./stage-hosting.cjs').stageHosting(root, stage)
