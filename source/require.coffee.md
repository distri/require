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

Require a module from the root directory of its package

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

Because we're in the browser window is global.

    global = window

A top-level module so that all other modules won't have to be orphans.

    rootModule =
      path: ""

Require a module given a path within a package. Each file is its own separate 
module. An application is composed of packages.

    loadPath = (parentModule, pkg, path) ->
      localPath = parentModule.path.split(fileSeparator)

      normalizedPath = normalizePath(path, localPath)
      
      cache = (pkg.cache ||= {})
      
      module = 
        cache[normalizedPath] ||= loadModule(normalizedPath, parentModule)

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
      path ||= pkg.entryPoint
      
      loadPath(parentModule, pkg, path)

Load a file from within our package.

    loadModule = (pkg, path) ->
      console.log "Loading module from package #{pkg} at #{path}"
      program = pkg.distribution[path].content

      throw "Could not find file: #{path} in package #{pkg}" unless program?

      module =
        path: path
        exports: {}

      context =
        require: (path) ->
          if otherPackage = isPackage(path)
            packagePath = path.replace(otherPackage, "")
            loadPackage(module, pkg.dependencies[otherPackage], packagePath)
          else
            loadPath.call(module, pkg, path)
        global: global
        module: module
        exports: module.exports
        __filename: path
        __dirname: path.split(fileSeparator)[0...-1]
      
      args = Object.keys(context)
      values = args.map (name) -> context[name]

      Function(args..., program).apply(module, values)

      return module

TODO: Package loading

    isPackage = (path) ->
      if !(path.startsWith(fileSeparator) or
        path.startsWith(".#{fileSeparator}") or
        path.startsWith("..#{fileSeparator}")
      )
        path.split(fileSeparator)[0]
      else
        false

Node needs to check file extensions, but because we have a compile step we are
able to compile all files extensionlessly based only on their path. So while
Node may need to check for either `path/somefile.js` or `path/somefile.coffee` 
that will already have been resolved for us and we will only check 
`path/somefile`

Transitional style of exports, if `module` exists because we are using a module
system then export in that manner, otherwise we are not using a module system
and must export our own global reference.

    if module?
      module.exports = (path) ->
        loadPath(rootModule, path)
    else
      @require = (path) ->
        loadPath(rootModule, ENV.root, path)
