Require
=======

A Node.js compatible require implementation for pure client side apps.

Each file is a module. Modules are responsible for exporting an object. Unlike
traditional client side JavaScript, Ruby, or other common languages the module
is not responsible for naming its product in the context of the requirer. This
maintains encapsulation because it is impossible from within a module to know
what external name would be correct to prevent errors of composition in all
possible uses.

Uses
----

From a module require another module in the same package.

>     require "./soup"

Require a module in the parent directory

>     require "../nuts"

Require a module from the root directory in the same package.

NOTE: This could behave slightly differently under Node.js if your package does
not have it's own jailed filesystem.

>     require "/silence"

From a module within a package, require a dependent package.

>     require "console"

The dependency will be delcared something like

>     dependencies:
>       console: "http://strd6.github.io/console/v1.2.2.json"

Implementation
--------------

File separator is '/'

    fileSeparator = '/'

In the browser `global` is `self`.

    global = self

Default entry point

    defaultEntryPoint = "main"

A sentinal against circular requires.

    circularGuard = {}

A top-level module so that all other modules won't have to be orphans.

    rootModule =
      path: ""

Require a module given a path within a package. Each file is its own separate
module. An application is composed of packages.

    loadPath = (parentModule, pkg, path) ->
      if startsWith(path, '/')
        localPath = []
      else
        localPath = parentModule.path.split(fileSeparator)

      normalizedPath = normalizePath(path, localPath)

      cache = cacheFor(pkg)

      if module = cache[normalizedPath]
        if module is circularGuard
          throw "Circular dependency detected when requiring #{normalizedPath}"
      else
        cache[normalizedPath] = circularGuard

        try
          cache[normalizedPath] = module = loadModule(pkg, normalizedPath)
        finally
          delete cache[normalizedPath] if cache[normalizedPath] is circularGuard

      return module.exports

To normalize the path we convert local paths to a standard form that does not
contain an references to current or parent directories.

    normalizePath = (path, base=[]) ->
      base = base.concat path.split(fileSeparator)
      result = []

Chew up all the pieces into a standardized path.

      while base.length
        switch piece = base.shift()
          when ".."
            result.pop()
          when "", "."
            # Skip
          else
            result.push(piece)

      return result.join(fileSeparator)

`loadPackage` Loads a dependent package at that packages entry point.

    loadPackage = (pkg) ->
      path = pkg.entryPoint or defaultEntryPoint

      loadPath(rootModule, pkg, path)

Load a file from within a package.

    loadModule = (pkg, path) ->
      unless (file = pkg.distribution[path])
        throw "Could not find file at #{path} in #{pkg.name}"

      unless (content = file.content)?
        throw "Malformed package. No content for file at #{path} in #{pkg.name}"

      program = annotateSourceURL content, pkg, path
      dirname = path.split(fileSeparator)[0...-1].join(fileSeparator)

      module =
        path: dirname
        exports: {}

This external context provides some variable that modules have access to.

A `require` function is exposed to modules so they may require other modules.

Additional properties such as a reference to the global object and some metadata
are also exposed.

      context =
        require: generateRequireFn(pkg, module)
        global: global
        module: module
        exports: module.exports
        PACKAGE: pkg
        __filename: path
        __dirname: dirname

      args = Object.keys(context)
      values = args.map (name) -> context[name]

Execute the program within the module and given context.

      Function(args..., program).apply(module, values)

      return module

Helper to detect if a given path is a package.

    isPackage = (path) ->
      if !(startsWith(path, fileSeparator) or
        startsWith(path, ".#{fileSeparator}") or
        startsWith(path, "..#{fileSeparator}")
      )
        path.split(fileSeparator)[0]
      else
        false

Generate a require function for a given module in a package.

If we are loading a package in another module then we strip out the module part
of the name and use the `rootModule` rather than the local module we came from.
That way our local path won't affect the lookup path in another package.

Loading a module within our package, uses the requiring module as a parent for
local path resolution.

    generateRequireFn = (pkg, module=rootModule) ->
      pkg.name ?= "ROOT"
      pkg.scopedName ?= "ROOT"

      (path) ->
        if isPackage(path)
          unless otherPackage = pkg.dependencies[path]
            throw "Package: #{path} not found."

          otherPackage.name ?= path
          otherPackage.scopedName ?= "#{pkg.scopedName}:#{path}"

          loadPackage(otherPackage)
        else
          loadPath(module, pkg, path)

Because we can't actually `require('require')` we need to export it a little
differently.

    if exports?
      exports.generateFor = generateRequireFn
    else
      global.Require =
        generateFor: generateRequireFn

Notes
-----

We have to use `pkg` as a variable name because `package` is a reserved word.

Node needs to check file extensions, but because we only load compiled products
we never have extensions in our path.

So while Node may need to check for either `path/somefile.js` or `path/somefile.coffee`
that will already have been resolved for us and we will only check `path/somefile`

Circular dependencies are not allowed and raise an exception when detected.

Helpers
-------

Detect if a string starts with a given prefix.

    startsWith = (string, prefix) ->
      string.lastIndexOf(prefix, 0) is 0

Creates a cache for modules within a package. It uses `defineProperty` so that
the cache doesn't end up being enumerated or serialized to json.

    cacheFor = (pkg) ->
      return pkg.cache if pkg.cache

      Object.defineProperty pkg, "cache",
        value: {}

      return pkg.cache

Annotate a program with a source url so we can debug in Chrome's dev tools.

    annotateSourceURL = (program, pkg, path) ->
      """
        #{program}
        //# sourceURL=#{pkg.scopedName}/#{path}
      """

Definitions
-----------

### Module

A module is a file.

### Package

A package is an aggregation of modules. A package is a json object with the
following properties:

- `distribution` An object whose keys are paths and properties are `fileData`
- `entryPoint` Path to the primary module that requiring this package will require.
- `dependencies` An object whose keys are names and whose values are packages.

It may have additional properties such as `source`, `repository`, and `docs`.

### Application

An application is a package which has an `entryPoint` and may have dependencies.
Additionally an application's dependencies may have dependencies. Dependencies
must be bundled with the package.
