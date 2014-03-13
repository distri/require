(function(pkg) {
  // Expose a require for our package so scripts can access our modules
  window.require = Require.generateFor(pkg);
})({
  "source": {
    "LICENSE": {
      "path": "LICENSE",
      "mode": "100644",
      "content": "The MIT License (MIT)\n\nCopyright (c) 2013 Daniel X Moore\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of\nthis software and associated documentation files (the \"Software\"), to deal in\nthe Software without restriction, including without limitation the rights to\nuse, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of\nthe Software, and to permit persons to whom the Software is furnished to do so,\nsubject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS\nFOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR\nCOPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER\nIN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN\nCONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n",
      "type": "blob"
    },
    "README.md": {
      "path": "README.md",
      "mode": "100644",
      "content": "require\n=======\n\nRequire system for self replicating client side apps\n",
      "type": "blob"
    },
    "main.coffee.md": {
      "path": "main.coffee.md",
      "mode": "100644",
      "content": "Require\n=======\n\nA Node.js compatible require implementation for pure client side apps.\n\nEach file is a module. Modules are responsible for exporting an object. Unlike\ntraditional client side JavaScript, Ruby, or other common languages the module\nis not responsible for naming its product in the context of the requirer. This\nmaintains encapsulation because it is impossible from within a module to know\nwhat external name would be correct to prevent errors of composition in all\npossible uses.\n\nDefinitions\n-----------\n\n### Module\n\nA module is a file.\n\n### Package\n\nA package is an aggregation of modules. A package is a json object with the\nfollowing properties:\n\n- `distribution` An object whose keys are paths and properties are `fileData`\n- `entryPoint` Path to the primary module that requiring this package will require.\n- `dependencies` An object whose keys are names and whose values are packages.\n\nIt may have additional properties such as `source`, `repository`, and `docs`.\n\n### Application\n\nAn application is a package which has an `entryPoint` and may have dependencies.\nAdditionally an application's dependencies may have dependencies. Dependencies\nmust be bundled with the package.\n\nUses\n----\n\nFrom a module require another module in the same package.\n\n>     require \"./soup\"\n\nRequire a module in the parent directory\n\n>     require \"../nuts\"\n\nRequire a module from the root directory in the same package.\n\nNOTE: This could behave slightly differently under Node.js if your package does\nnot have it's own jailed filesystem.\n\n>     require \"/silence\"\n\nFrom a module within a package, require a dependent package.\n\n>     require \"console\"\n\nThe dependency will be delcared something like\n\n>     dependencies:\n>       console: \"http://strd6.github.io/console/v1.2.2.json\"\n\nImplementation\n--------------\n\nFile separator is '/'\n\n    fileSeparator = '/'\n\nIn the browser `global` is `window`.\n\n    global = window\n\nDefault entry point\n\n    defaultEntryPoint = \"main\"\n\nA sentinal against circular requires.\n\n    circularGuard = {}\n\nA top-level module so that all other modules won't have to be orphans.\n\n    rootModule =\n      path: \"\"\n\nRequire a module given a path within a package. Each file is its own separate\nmodule. An application is composed of packages.\n\n    loadPath = (parentModule, pkg, path) ->\n      if startsWith(path, '/')\n        localPath = []\n      else\n        localPath = parentModule.path.split(fileSeparator)\n\n      normalizedPath = normalizePath(path, localPath)\n\n      cache = cacheFor(pkg)\n\n      if module = cache[normalizedPath]\n        if module is circularGuard\n          throw \"Circular dependency detected when requiring #{normalizedPath}\"\n      else\n        cache[normalizedPath] = circularGuard\n\n        try\n          cache[normalizedPath] = module = loadModule(pkg, normalizedPath)\n        finally\n          delete cache[normalizedPath] if cache[normalizedPath] is circularGuard\n\n      return module.exports\n\nTo normalize the path we convert local paths to a standard form that does not\ncontain an references to current or parent directories.\n\n    normalizePath = (path, base=[]) ->\n      base = base.concat path.split(fileSeparator)\n      result = []\n\nChew up all the pieces into a standardized path.\n\n      while base.length\n        switch piece = base.shift()\n          when \"..\"\n            result.pop()\n          when \"\", \".\"\n            # Skip\n          else\n            result.push(piece)\n\n      return result.join(fileSeparator)\n\n`loadPackage` Loads a dependent package at that packages entry point.\n\n    loadPackage = (parentModule, pkg) ->\n      path = pkg.entryPoint or defaultEntryPoint\n\n      loadPath(parentModule, pkg, path)\n\nLoad a file from within a package.\n\n    loadModule = (pkg, path) ->\n      unless (file = pkg.distribution[path])\n        throw \"Could not find file at #{path} in #{pkg.name}\"\n\n      program = file.content\n      dirname = path.split(fileSeparator)[0...-1].join(fileSeparator)\n\n      module =\n        path: dirname\n        exports: {}\n\nThis external context provides some variable that modules have access to.\n\nA `require` function is exposed to modules so they may require other modules.\n\nAdditional properties such as a reference to the global object and some metadata\nare also exposed.\n\n      context =\n        require: generateRequireFn(pkg, module)\n        global: global\n        module: module\n        exports: module.exports\n        PACKAGE: pkg\n        __filename: path\n        __dirname: dirname\n\n      args = Object.keys(context)\n      values = args.map (name) -> context[name]\n\nExecute the program within the module and given context.\n\n      Function(args..., program).apply(module, values)\n\n      return module\n\nHelper to detect if a given path is a package.\n\n    isPackage = (path) ->\n      if !(startsWith(path, fileSeparator) or\n        startsWith(path, \".#{fileSeparator}\") or\n        startsWith(path, \"..#{fileSeparator}\")\n      )\n        path.split(fileSeparator)[0]\n      else\n        false\n\nGenerate a require function for a given module in a package.\n\nIf we are loading a package in another module then we strip out the module part\nof the name and use the `rootModule` rather than the local module we came from.\nThat way our local path won't affect the lookup path in another package.\n\nLoading a module within our package, uses the requiring module as a parent for\nlocal path resolution.\n\n    generateRequireFn = (pkg, module=rootModule) ->\n      pkg.name ?= \"ROOT\"\n\n      (path) ->\n        if isPackage(path)\n          unless otherPackage = pkg.dependencies[path]\n            throw \"Package: #{path} not found.\"\n\n          otherPackage.name ?= path\n\n          loadPackage(rootModule, otherPackage)\n        else\n          loadPath(module, pkg, path)\n\nBecause we can't actually `require('require')` we need to export it a little\ndifferently.\n\n    if exports?\n      exports.generateFor = generateRequireFn\n    else\n      global.Require =\n        generateFor: generateRequireFn\n\nNotes\n-----\n\nWe have to use `pkg` as a variable name because `package` is a reserved word.\n\nNode needs to check file extensions, but because we only load compiled products\nwe never have extensions in our path.\n\nSo while Node may need to check for either `path/somefile.js` or `path/somefile.coffee`\nthat will already have been resolved for us and we will only check `path/somefile`\n\nCircular dependencies are not allowed and raise an exception when detected.\n\nHelpers\n-------\n\nDetect if a string starts with a given prefix.\n\n    startsWith = (string, prefix) ->\n      string.lastIndexOf(prefix, 0) is 0\n\nCreates a cache for modules within a package. It uses `defineProperty` so that\nthe cache doesn't end up being enumerated or serialized to json.\n\n    cacheFor = (pkg) ->\n      return pkg.cache if pkg.cache\n\n      Object.defineProperty pkg, \"cache\",\n        value: {}\n\n      return pkg.cache\n",
      "type": "blob"
    },
    "pixie.cson": {
      "path": "pixie.cson",
      "mode": "100644",
      "content": "version: \"0.4.1\"\n",
      "type": "blob"
    },
    "samples/circular.coffee": {
      "path": "samples/circular.coffee",
      "mode": "100644",
      "content": "# This test file illustrates a circular requirement and should throw an error.\n\nrequire \"./circular\"\n",
      "type": "blob"
    },
    "samples/random.coffee": {
      "path": "samples/random.coffee",
      "mode": "100644",
      "content": "# Returns a random value, used for testing caching\n\nmodule.exports = Math.random()\n",
      "type": "blob"
    },
    "samples/terminal.coffee": {
      "path": "samples/terminal.coffee",
      "mode": "100644",
      "content": "# A test file for requiring a file that has no dependencies. It should succeed.\n\nexports.something = true\n",
      "type": "blob"
    },
    "samples/throws.coffee": {
      "path": "samples/throws.coffee",
      "mode": "100644",
      "content": "# A test file that throws an error.\n\nthrow \"yolo\"\n",
      "type": "blob"
    },
    "test/require.coffee.md": {
      "path": "test/require.coffee.md",
      "mode": "100644",
      "content": "Testing out this crazy require thing\n\n    # Load our latest require code for testing\n    # NOTE: This causes the root for relative requires to be at the root dir, not the test dir\n    latestRequire = require('/main').generateFor(PACKAGE)\n\n    describe \"PACKAGE\", ->\n      it \"should be named 'ROOT'\", ->\n        assert.equal PACKAGE.name, \"ROOT\"\n\n    describe \"require\", ->\n      it \"should not exist globally\", ->\n        assert !global.require\n\n      it \"should be able to require a file that exists with a relative path\", ->\n        assert latestRequire('/samples/terminal')\n\n      it \"should get whatever the file exports\", ->\n        assert latestRequire('/samples/terminal').something\n\n      it \"should not get something the file doesn't export\", ->\n        assert !latestRequire('/samples/terminal').something2\n\n      it \"should throw a descriptive error when requring circular dependencies\", ->\n        assert.throws ->\n          latestRequire('/samples/circular')\n        , /circular/i\n\n      it \"should throw a descriptive error when requiring a package that doesn't exist\", ->\n        assert.throws ->\n          latestRequire \"does_not_exist\"\n        , /not found/i\n\n      it \"should throw a descriptive error when requiring a relative path that doesn't exist\", ->\n        assert.throws ->\n          latestRequire \"/does_not_exist\"\n        , /Could not find file/i\n\n      it \"should recover gracefully enough from requiring files that throw errors\", ->\n        assert.throws ->\n          latestRequire \"/samples/throws\"\n\n        assert.throws ->\n          latestRequire \"/samples/throws\"\n        , (err) ->\n          !/circular/i.test err\n\n      it \"should cache modules\", ->\n        result = require(\"/samples/random\")\n\n        assert.equal require(\"/samples/random\"), result\n\n    describe \"module context\", ->\n      it \"should know __dirname\", ->\n        assert.equal \"test\", __dirname\n\n      it \"should know __filename\", ->\n        assert __filename\n\n      it \"should know its package\", ->\n        assert PACKAGE\n\n    describe \"dependent packages\", ->\n      PACKAGE.dependencies[\"test-package\"] =\n        distribution:\n          main:\n            content: \"module.exports = PACKAGE.name\"\n\n      PACKAGE.dependencies[\"strange/name\"] =\n        distribution:\n          main:\n            content: \"\"\n\n      it \"should raise an error when requiring a package that doesn't exist\", ->\n        assert.throws ->\n          latestRequire \"nonexistent\"\n        , (err) ->\n          /nonexistent/i.test err\n\n      it \"should be able to require a package that exists\", ->\n        assert latestRequire(\"test-package\")\n\n      it \"Dependent packages should know their names when required\", ->\n        assert.equal latestRequire(\"test-package\"), \"test-package\"\n\n      it \"should be able to require by pretty much any name\", ->\n        assert latestRequire(\"strange/name\")\n",
      "type": "blob"
    }
  },
  "distribution": {
    "main": {
      "path": "main",
      "content": "(function() {\n  var cacheFor, circularGuard, defaultEntryPoint, fileSeparator, generateRequireFn, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, rootModule, startsWith,\n    __slice = [].slice;\n\n  fileSeparator = '/';\n\n  global = window;\n\n  defaultEntryPoint = \"main\";\n\n  circularGuard = {};\n\n  rootModule = {\n    path: \"\"\n  };\n\n  loadPath = function(parentModule, pkg, path) {\n    var cache, localPath, module, normalizedPath;\n    if (startsWith(path, '/')) {\n      localPath = [];\n    } else {\n      localPath = parentModule.path.split(fileSeparator);\n    }\n    normalizedPath = normalizePath(path, localPath);\n    cache = cacheFor(pkg);\n    if (module = cache[normalizedPath]) {\n      if (module === circularGuard) {\n        throw \"Circular dependency detected when requiring \" + normalizedPath;\n      }\n    } else {\n      cache[normalizedPath] = circularGuard;\n      try {\n        cache[normalizedPath] = module = loadModule(pkg, normalizedPath);\n      } finally {\n        if (cache[normalizedPath] === circularGuard) {\n          delete cache[normalizedPath];\n        }\n      }\n    }\n    return module.exports;\n  };\n\n  normalizePath = function(path, base) {\n    var piece, result;\n    if (base == null) {\n      base = [];\n    }\n    base = base.concat(path.split(fileSeparator));\n    result = [];\n    while (base.length) {\n      switch (piece = base.shift()) {\n        case \"..\":\n          result.pop();\n          break;\n        case \"\":\n        case \".\":\n          break;\n        default:\n          result.push(piece);\n      }\n    }\n    return result.join(fileSeparator);\n  };\n\n  loadPackage = function(parentModule, pkg) {\n    var path;\n    path = pkg.entryPoint || defaultEntryPoint;\n    return loadPath(parentModule, pkg, path);\n  };\n\n  loadModule = function(pkg, path) {\n    var args, context, dirname, file, module, program, values;\n    if (!(file = pkg.distribution[path])) {\n      throw \"Could not find file at \" + path + \" in \" + pkg.name;\n    }\n    program = file.content;\n    dirname = path.split(fileSeparator).slice(0, -1).join(fileSeparator);\n    module = {\n      path: dirname,\n      exports: {}\n    };\n    context = {\n      require: generateRequireFn(pkg, module),\n      global: global,\n      module: module,\n      exports: module.exports,\n      PACKAGE: pkg,\n      __filename: path,\n      __dirname: dirname\n    };\n    args = Object.keys(context);\n    values = args.map(function(name) {\n      return context[name];\n    });\n    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);\n    return module;\n  };\n\n  isPackage = function(path) {\n    if (!(startsWith(path, fileSeparator) || startsWith(path, \".\" + fileSeparator) || startsWith(path, \"..\" + fileSeparator))) {\n      return path.split(fileSeparator)[0];\n    } else {\n      return false;\n    }\n  };\n\n  generateRequireFn = function(pkg, module) {\n    if (module == null) {\n      module = rootModule;\n    }\n    if (pkg.name == null) {\n      pkg.name = \"ROOT\";\n    }\n    return function(path) {\n      var otherPackage;\n      if (isPackage(path)) {\n        if (!(otherPackage = pkg.dependencies[path])) {\n          throw \"Package: \" + path + \" not found.\";\n        }\n        if (otherPackage.name == null) {\n          otherPackage.name = path;\n        }\n        return loadPackage(rootModule, otherPackage);\n      } else {\n        return loadPath(module, pkg, path);\n      }\n    };\n  };\n\n  if (typeof exports !== \"undefined\" && exports !== null) {\n    exports.generateFor = generateRequireFn;\n  } else {\n    global.Require = {\n      generateFor: generateRequireFn\n    };\n  }\n\n  startsWith = function(string, prefix) {\n    return string.lastIndexOf(prefix, 0) === 0;\n  };\n\n  cacheFor = function(pkg) {\n    if (pkg.cache) {\n      return pkg.cache;\n    }\n    Object.defineProperty(pkg, \"cache\", {\n      value: {}\n    });\n    return pkg.cache;\n  };\n\n}).call(this);\n\n//# sourceURL=main.coffee",
      "type": "blob"
    },
    "pixie": {
      "path": "pixie",
      "content": "module.exports = {\"version\":\"0.4.1\"};",
      "type": "blob"
    },
    "samples/circular": {
      "path": "samples/circular",
      "content": "(function() {\n  require(\"./circular\");\n\n}).call(this);\n\n//# sourceURL=samples/circular.coffee",
      "type": "blob"
    },
    "samples/random": {
      "path": "samples/random",
      "content": "(function() {\n  module.exports = Math.random();\n\n}).call(this);\n\n//# sourceURL=samples/random.coffee",
      "type": "blob"
    },
    "samples/terminal": {
      "path": "samples/terminal",
      "content": "(function() {\n  exports.something = true;\n\n}).call(this);\n\n//# sourceURL=samples/terminal.coffee",
      "type": "blob"
    },
    "samples/throws": {
      "path": "samples/throws",
      "content": "(function() {\n  throw \"yolo\";\n\n}).call(this);\n\n//# sourceURL=samples/throws.coffee",
      "type": "blob"
    },
    "test/require": {
      "path": "test/require",
      "content": "(function() {\n  var latestRequire;\n\n  latestRequire = require('/main').generateFor(PACKAGE);\n\n  describe(\"PACKAGE\", function() {\n    return it(\"should be named 'ROOT'\", function() {\n      return assert.equal(PACKAGE.name, \"ROOT\");\n    });\n  });\n\n  describe(\"require\", function() {\n    it(\"should not exist globally\", function() {\n      return assert(!global.require);\n    });\n    it(\"should be able to require a file that exists with a relative path\", function() {\n      return assert(latestRequire('/samples/terminal'));\n    });\n    it(\"should get whatever the file exports\", function() {\n      return assert(latestRequire('/samples/terminal').something);\n    });\n    it(\"should not get something the file doesn't export\", function() {\n      return assert(!latestRequire('/samples/terminal').something2);\n    });\n    it(\"should throw a descriptive error when requring circular dependencies\", function() {\n      return assert.throws(function() {\n        return latestRequire('/samples/circular');\n      }, /circular/i);\n    });\n    it(\"should throw a descriptive error when requiring a package that doesn't exist\", function() {\n      return assert.throws(function() {\n        return latestRequire(\"does_not_exist\");\n      }, /not found/i);\n    });\n    it(\"should throw a descriptive error when requiring a relative path that doesn't exist\", function() {\n      return assert.throws(function() {\n        return latestRequire(\"/does_not_exist\");\n      }, /Could not find file/i);\n    });\n    it(\"should recover gracefully enough from requiring files that throw errors\", function() {\n      assert.throws(function() {\n        return latestRequire(\"/samples/throws\");\n      });\n      return assert.throws(function() {\n        return latestRequire(\"/samples/throws\");\n      }, function(err) {\n        return !/circular/i.test(err);\n      });\n    });\n    return it(\"should cache modules\", function() {\n      var result;\n      result = require(\"/samples/random\");\n      return assert.equal(require(\"/samples/random\"), result);\n    });\n  });\n\n  describe(\"module context\", function() {\n    it(\"should know __dirname\", function() {\n      return assert.equal(\"test\", __dirname);\n    });\n    it(\"should know __filename\", function() {\n      return assert(__filename);\n    });\n    return it(\"should know its package\", function() {\n      return assert(PACKAGE);\n    });\n  });\n\n  describe(\"dependent packages\", function() {\n    PACKAGE.dependencies[\"test-package\"] = {\n      distribution: {\n        main: {\n          content: \"module.exports = PACKAGE.name\"\n        }\n      }\n    };\n    PACKAGE.dependencies[\"strange/name\"] = {\n      distribution: {\n        main: {\n          content: \"\"\n        }\n      }\n    };\n    it(\"should raise an error when requiring a package that doesn't exist\", function() {\n      return assert.throws(function() {\n        return latestRequire(\"nonexistent\");\n      }, function(err) {\n        return /nonexistent/i.test(err);\n      });\n    });\n    it(\"should be able to require a package that exists\", function() {\n      return assert(latestRequire(\"test-package\"));\n    });\n    it(\"Dependent packages should know their names when required\", function() {\n      return assert.equal(latestRequire(\"test-package\"), \"test-package\");\n    });\n    return it(\"should be able to require by pretty much any name\", function() {\n      return assert(latestRequire(\"strange/name\"));\n    });\n  });\n\n}).call(this);\n\n//# sourceURL=test/require.coffee",
      "type": "blob"
    }
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  },
  "version": "0.4.1",
  "entryPoint": "main",
  "repository": {
    "id": 12814740,
    "name": "require",
    "full_name": "distri/require",
    "owner": {
      "login": "distri",
      "id": 6005125,
      "avatar_url": "https://gravatar.com/avatar/192f3f168409e79c42107f081139d9f3?d=https%3A%2F%2Fidenticons.github.com%2Ff90c81ffc1498e260c820082f2e7ca5f.png&r=x",
      "gravatar_id": "192f3f168409e79c42107f081139d9f3",
      "url": "https://api.github.com/users/distri",
      "html_url": "https://github.com/distri",
      "followers_url": "https://api.github.com/users/distri/followers",
      "following_url": "https://api.github.com/users/distri/following{/other_user}",
      "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
      "organizations_url": "https://api.github.com/users/distri/orgs",
      "repos_url": "https://api.github.com/users/distri/repos",
      "events_url": "https://api.github.com/users/distri/events{/privacy}",
      "received_events_url": "https://api.github.com/users/distri/received_events",
      "type": "Organization",
      "site_admin": false
    },
    "private": false,
    "html_url": "https://github.com/distri/require",
    "description": "Require system for self replicating client side apps",
    "fork": false,
    "url": "https://api.github.com/repos/distri/require",
    "forks_url": "https://api.github.com/repos/distri/require/forks",
    "keys_url": "https://api.github.com/repos/distri/require/keys{/key_id}",
    "collaborators_url": "https://api.github.com/repos/distri/require/collaborators{/collaborator}",
    "teams_url": "https://api.github.com/repos/distri/require/teams",
    "hooks_url": "https://api.github.com/repos/distri/require/hooks",
    "issue_events_url": "https://api.github.com/repos/distri/require/issues/events{/number}",
    "events_url": "https://api.github.com/repos/distri/require/events",
    "assignees_url": "https://api.github.com/repos/distri/require/assignees{/user}",
    "branches_url": "https://api.github.com/repos/distri/require/branches{/branch}",
    "tags_url": "https://api.github.com/repos/distri/require/tags",
    "blobs_url": "https://api.github.com/repos/distri/require/git/blobs{/sha}",
    "git_tags_url": "https://api.github.com/repos/distri/require/git/tags{/sha}",
    "git_refs_url": "https://api.github.com/repos/distri/require/git/refs{/sha}",
    "trees_url": "https://api.github.com/repos/distri/require/git/trees{/sha}",
    "statuses_url": "https://api.github.com/repos/distri/require/statuses/{sha}",
    "languages_url": "https://api.github.com/repos/distri/require/languages",
    "stargazers_url": "https://api.github.com/repos/distri/require/stargazers",
    "contributors_url": "https://api.github.com/repos/distri/require/contributors",
    "subscribers_url": "https://api.github.com/repos/distri/require/subscribers",
    "subscription_url": "https://api.github.com/repos/distri/require/subscription",
    "commits_url": "https://api.github.com/repos/distri/require/commits{/sha}",
    "git_commits_url": "https://api.github.com/repos/distri/require/git/commits{/sha}",
    "comments_url": "https://api.github.com/repos/distri/require/comments{/number}",
    "issue_comment_url": "https://api.github.com/repos/distri/require/issues/comments/{number}",
    "contents_url": "https://api.github.com/repos/distri/require/contents/{+path}",
    "compare_url": "https://api.github.com/repos/distri/require/compare/{base}...{head}",
    "merges_url": "https://api.github.com/repos/distri/require/merges",
    "archive_url": "https://api.github.com/repos/distri/require/{archive_format}{/ref}",
    "downloads_url": "https://api.github.com/repos/distri/require/downloads",
    "issues_url": "https://api.github.com/repos/distri/require/issues{/number}",
    "pulls_url": "https://api.github.com/repos/distri/require/pulls{/number}",
    "milestones_url": "https://api.github.com/repos/distri/require/milestones{/number}",
    "notifications_url": "https://api.github.com/repos/distri/require/notifications{?since,all,participating}",
    "labels_url": "https://api.github.com/repos/distri/require/labels{/name}",
    "releases_url": "https://api.github.com/repos/distri/require/releases{/id}",
    "created_at": "2013-09-13T17:00:23Z",
    "updated_at": "2014-03-13T16:53:59Z",
    "pushed_at": "2014-02-19T21:16:06Z",
    "git_url": "git://github.com/distri/require.git",
    "ssh_url": "git@github.com:distri/require.git",
    "clone_url": "https://github.com/distri/require.git",
    "svn_url": "https://github.com/distri/require",
    "homepage": null,
    "size": 584,
    "stargazers_count": 1,
    "watchers_count": 1,
    "language": "CoffeeScript",
    "has_issues": true,
    "has_downloads": true,
    "has_wiki": true,
    "forks_count": 0,
    "mirror_url": null,
    "open_issues_count": 0,
    "forks": 0,
    "open_issues": 0,
    "watchers": 1,
    "default_branch": "master",
    "master_branch": "master",
    "permissions": {
      "admin": true,
      "push": true,
      "pull": true
    },
    "organization": {
      "login": "distri",
      "id": 6005125,
      "avatar_url": "https://gravatar.com/avatar/192f3f168409e79c42107f081139d9f3?d=https%3A%2F%2Fidenticons.github.com%2Ff90c81ffc1498e260c820082f2e7ca5f.png&r=x",
      "gravatar_id": "192f3f168409e79c42107f081139d9f3",
      "url": "https://api.github.com/users/distri",
      "html_url": "https://github.com/distri",
      "followers_url": "https://api.github.com/users/distri/followers",
      "following_url": "https://api.github.com/users/distri/following{/other_user}",
      "gists_url": "https://api.github.com/users/distri/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/distri/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/distri/subscriptions",
      "organizations_url": "https://api.github.com/users/distri/orgs",
      "repos_url": "https://api.github.com/users/distri/repos",
      "events_url": "https://api.github.com/users/distri/events{/privacy}",
      "received_events_url": "https://api.github.com/users/distri/received_events",
      "type": "Organization",
      "site_admin": false
    },
    "network_count": 0,
    "subscribers_count": 1,
    "branch": "v0.4.1",
    "publishBranch": "gh-pages"
  },
  "dependencies": {}
});