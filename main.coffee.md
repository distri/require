Require
=======

A Node.js compatible require implementation for pure client side apps.

Each file is a module. Modules are responsible for exporting an object. Unlike
traditional client side JavaScript, Ruby, or other common languages the module
is not responsible for naming its product in the context of the requirer. This
maintains encapsulation because it is impossible from within a module to know
what external name would be correct to prevent errors of composition in all
possible uses.

Definitions
-----------

## Module

A module is a file.

## Package

A package is an aggregation of modules. A package is a json file that lives on
the internet. 

It has the following properties:

- distribution An object whose keys are paths an properties are `fileData`
- entryPoint Path to the primary module that requiring this package will require.
- dependencies An object whose keys are names and whose values are urls, 
  bundled packages, or package reference objects.

It may have additional properties such as `source`, `repository`, and `docs`.

## Application

An application is a package which has an `entryPoint` and may have dependencies.
An application's dependencies may have dependencies. Dependencies may be 
bundled with a package or resolved at a separate time.

Uses
----

From a module require another module in the same package.

>     require "./soup"

Require a module in the parent directory

>     require "../nuts"

Require a module from the root directory in the same package

>     require "/silence"

From a module within a package, require a dependent package.

>     require "console"

The dependency will be delcared something like

>     dependencies:
>       console: "http://strd6.github.io/console/v1.2.2.json"

You may also require an optional module from within another package

>     require "console/extras"

Implementation
--------------
    
File separator is '/'

    fileSeparator = '/'

In the browser `global` is `window`.

    global = window

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
      if path.startsWith('/')
        localPath = []
      else
        localPath = parentModule.path.split(fileSeparator)

      normalizedPath = normalizePath(path, localPath)
      
      cache = (pkg.cache ||= {})
      
      if module = cache[normalizedPath]
        if module is circularGuard
          throw "Circular dependency detected when requiring #{normalizedPath}"
      else
        cache[normalizedPath] = circularGuard
        cache[normalizedPath] = loadModule(pkg, normalizedPath)

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

`loadPackage` Loads a module from a package, optionally specifying a path. If a
path is given the module at that path is loaded, otherwise the `entryPoint`
specified in the package is loaded.

    loadPackage = (parentModule, pkg, path) ->
      path ||= (pkg.entryPoint || defaultEntryPoint)
      
      loadPath(parentModule, pkg, path)

Load a file from within a package.

    loadModule = (pkg, path) ->
      unless (file = pkg.distribution[path])
        throw "Could not find file at #{path} in #{pkg.name}" 

      program = file.content
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
      if !(path.startsWith(fileSeparator) or
        path.startsWith(".#{fileSeparator}") or
        path.startsWith("..#{fileSeparator}")
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
      (path) ->
        if otherPackageName = isPackage(path)
          packagePath = path.replace(otherPackageName, "")
          
          otherPackage = pkg.dependencies[otherPackageName]
          otherPackage.name ?= otherPackageName
          
          unless otherPackage
            throw "Package: #{otherPackageName} not found."
          
          loadPackage(rootModule, otherPackage, packagePath)
        else
          loadPath(module, pkg, path)

Because we can't actually `require('require')` we need to export it a little
differently.

    Require = 
      generateFor: generateRequireFn

    if exports?
      Object.extend exports, Require
    else
      global.Require = Require

Notes
-----

We have to use `pkg` because `package` is a reserved word.

Node needs to check file extensions, but because we have a compile step we are
able to compile all files extensionlessly based only on their path. So while
Node may need to check for either `path/somefile.js` or `path/somefile.coffee` 
that will already have been resolved for us and we will only check 
`path/somefile`

File extensions may come in handy if we want to skip the compile step and
compile on the fly at runtime.

Circular dependencies aren't supported and will probably crash.