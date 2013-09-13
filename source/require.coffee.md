Require
=======

A Node.js compatible require implementation for pure client side apps.

Each file is a module. Modules are responsible for exporting an object. Unlike
traditional client side JavaScript, Ruby, or other common languages the module
is not responsible for naming its product in the context of the requirer. This
maintains encapsulation because it is impossible from within a module to know
what external name would be correct to prevent errors of composition in all
possible uses.

Implementation
--------------

Keep a cache of loaded modules so that multiple calls to the same name return
the same module.

    cache = {}
    
File separator is '/'

    fileSeparator = '/'

Because we're in the browser window is global.

    global = window

A top-level module so that all other modules won't have to be orphans.

    rootModule =
      path: "/"

Require a module based on a path. Each file is its own separate module.

    require = (path) ->
      parent = this
      
      console.log parent

      if isPackage(path)
        # TODO
        return {}

      localPath = parent?.path.split(fileSeparator) or []

      normalizedPath = normalizePath(path, localPath)
      
      module = 
        cache[normalizedPath] ||= loadModule(normalizedPath, parent)

      return module.exports

To normalize the path we convert local paths to a standard form that does not
contain an references to current or parent directories.

    normalizePath = (path, base=[]) ->
      [first, rest...] = pieces = path.split(fileSeparator)

Chew up all the pieces into a standardized path.

      while pieces.length
        switch piece = pieces.shift()
          when ".."
            base.pop()
          when "", "."
            # Skip
          else
            base.push(piece)
            
      return base.join(fileSeparator)

Load a file from within our package.

    loadModule = (path) ->
      console.log "Loading module at #{path}"
      program = ENV.distribution[path].content

      throw "Could not find file: #{path}" unless program?

      module =
        path: path
        exports: {}

      context =
        ENV: ENV
        require: (path) -> 
          require.call(module, path)
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
      !(path.startsWith('/') or
        path.startsWith('./') or
        path.startsWith('../')
      )

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
        require.call(rootModule, path)
    else
      @require = (path) ->
        require.call(rootModule, path)
