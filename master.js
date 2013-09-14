(function (ENV) {
(function() {
  var fileSeparator, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, rootModule,
    __slice = [].slice;

  fileSeparator = '/';

  global = window;

  rootModule = {
    path: ""
  };

  loadPath = function(parentModule, pkg, path) {
    var cache, localPath, module, normalizedPath;
    localPath = parentModule.path.split(fileSeparator);
    normalizedPath = normalizePath(path, localPath);
    cache = (pkg.cache || (pkg.cache = {}));
    module = cache[normalizedPath] || (cache[normalizedPath] = loadModule(normalizedPath, parentModule));
    return module.exports;
  };

  normalizePath = function(path, base) {
    var piece, result;
    if (base == null) {
      base = [];
    }
    base = base.concat(path.split(fileSeparator));
    result = [];
    while (base.length) {
      switch (piece = base.shift()) {
        case "..":
          result.pop();
          break;
        case "":
        case ".":
          break;
        default:
          result.push(piece);
      }
    }
    return result.join(fileSeparator);
  };

  loadPackage = function(parentModule, pkg, path) {
    path || (path = pkg.entryPoint);
    return loadPath(parentModule, pkg, path);
  };

  loadModule = function(pkg, path) {
    var args, context, module, program, values;
    console.log("Loading module from package " + pkg + " at " + path);
    program = pkg.distribution[path].content;
    if (program == null) {
      throw "Could not find file: " + path + " in package " + pkg;
    }
    module = {
      path: path,
      exports: {}
    };
    context = {
      require: function(path) {
        var otherPackage, packagePath;
        if (otherPackage = isPackage(path)) {
          packagePath = path.replace(otherPackage, "");
          return loadPackage(module, pkg.dependencies[otherPackage], packagePath);
        } else {
          return loadPath.call(module, pkg, path);
        }
      },
      global: global,
      module: module,
      exports: module.exports,
      __filename: path,
      __dirname: path.split(fileSeparator).slice(0, -1)
    };
    args = Object.keys(context);
    values = args.map(function(name) {
      return context[name];
    });
    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);
    return module;
  };

  isPackage = function(path) {
    if (!(path.startsWith(fileSeparator) || path.startsWith("." + fileSeparator) || path.startsWith(".." + fileSeparator))) {
      return path.split(fileSeparator)[0];
    } else {
      return false;
    }
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = function(path) {
      return loadPath(rootModule, path);
    };
  } else {
    this.require = function(path) {
      return loadPath(rootModule, ENV.root, path);
    };
  }

}).call(this);
;(function() {


}).call(this);
;(function() {


}).call(this);
}({
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
    "source/require.coffee.md": {
      "path": "source/require.coffee.md",
      "mode": "100644",
      "content": "Require\n=======\n\nA Node.js compatible require implementation for pure client side apps.\n\nEach file is a module. Modules are responsible for exporting an object. Unlike\ntraditional client side JavaScript, Ruby, or other common languages the module\nis not responsible for naming its product in the context of the requirer. This\nmaintains encapsulation because it is impossible from within a module to know\nwhat external name would be correct to prevent errors of composition in all\npossible uses.\n\nDefinitions\n-----------\n\n## Module\n\nA module is a file.\n\n## Package\n\nA package is an aggregation of modules. A package is a json file that lives on\nthe internet. \n\nIt has the following properties:\n\n- distribution An object whose keys are paths an properties are `fileData`\n- entryPoint Path to the primary module that requiring this package will require.\n- dependencies An object whose keys are names and whose values are urls, \n  bundled packages, or package reference objects.\n\nIt may have additional properties such as `source`, `repository`, and `docs`.\n\n## Application\n\nAn application is a package which has an `entryPoint` and may have dependencies.\nAn application's dependencies may have dependencies. Dependencies may be \nbundled with a package or resolved at a separate time.\n\nUses\n----\n\nFrom a module require another module in the same package.\n\n>     require \"./soup\"\n\nRequire a module in the parent directory\n\n>     require \"../nuts\"\n\nRequire a module from the root directory of its package\n\n>     require \"/silence\"\n\nFrom a module within a package, require a dependent package.\n\n>     require \"console\"\n\nThe dependency will be delcared something like\n\n>     dependencies:\n>       console: \"http://strd6.github.io/console/v1.2.2.json\"\n\nYou may also require an optional module from within another package\n\n>     require \"console/extras\"\n\nImplementation\n--------------\n    \nFile separator is '/'\n\n    fileSeparator = '/'\n\nBecause we're in the browser window is global.\n\n    global = window\n\nA top-level module so that all other modules won't have to be orphans.\n\n    rootModule =\n      path: \"\"\n\nRequire a module given a path within a package. Each file is its own separate \nmodule. An application is composed of packages.\n\n    loadPath = (parentModule, pkg, path) ->\n      localPath = parentModule.path.split(fileSeparator)\n\n      normalizedPath = normalizePath(path, localPath)\n      \n      cache = (pkg.cache ||= {})\n      \n      module = \n        cache[normalizedPath] ||= loadModule(normalizedPath, parentModule)\n\n      return module.exports\n\nTo normalize the path we convert local paths to a standard form that does not\ncontain an references to current or parent directories.\n\n    normalizePath = (path, base=[]) ->\n      base = base.concat path.split(fileSeparator)\n      result = []\n\nChew up all the pieces into a standardized path.\n\n      while base.length\n        switch piece = base.shift()\n          when \"..\"\n            result.pop()\n          when \"\", \".\"\n            # Skip\n          else\n            result.push(piece)\n            \n      return result.join(fileSeparator)\n\n`loadPackage` Loads a module from a package, optionally specifying a path. If a\npath is given the module at that path is loaded, otherwise the `entryPoint`\nspecified in the package is loaded.\n\n    loadPackage = (parentModule, pkg, path) ->\n      path ||= pkg.entryPoint\n      \n      loadPath(parentModule, pkg, path)\n\nLoad a file from within our package.\n\n    loadModule = (pkg, path) ->\n      console.log \"Loading module from package #{pkg} at #{path}\"\n      program = pkg.distribution[path].content\n\n      throw \"Could not find file: #{path} in package #{pkg}\" unless program?\n\n      module =\n        path: path\n        exports: {}\n\n      context =\n        require: (path) ->\n          if otherPackage = isPackage(path)\n            packagePath = path.replace(otherPackage, \"\")\n            loadPackage(module, pkg.dependencies[otherPackage], packagePath)\n          else\n            loadPath.call(module, pkg, path)\n        global: global\n        module: module\n        exports: module.exports\n        __filename: path\n        __dirname: path.split(fileSeparator)[0...-1]\n      \n      args = Object.keys(context)\n      values = args.map (name) -> context[name]\n\n      Function(args..., program).apply(module, values)\n\n      return module\n\nTODO: Package loading\n\n    isPackage = (path) ->\n      if !(path.startsWith(fileSeparator) or\n        path.startsWith(\".#{fileSeparator}\") or\n        path.startsWith(\"..#{fileSeparator}\")\n      )\n        path.split(fileSeparator)[0]\n      else\n        false\n\nNode needs to check file extensions, but because we have a compile step we are\nable to compile all files extensionlessly based only on their path. So while\nNode may need to check for either `path/somefile.js` or `path/somefile.coffee` \nthat will already have been resolved for us and we will only check \n`path/somefile`\n\nTransitional style of exports, if `module` exists because we are using a module\nsystem then export in that manner, otherwise we are not using a module system\nand must export our own global reference.\n\n    if module?\n      module.exports = (path) ->\n        loadPath(rootModule, path)\n    else\n      @require = (path) ->\n        loadPath(rootModule, ENV.root, path)\n",
      "type": "blob"
    },
    "parent.coffee.md": {
      "path": "parent.coffee.md",
      "mode": "100644",
      "content": "A test file that can require another file.\n\n    # child = require('./child')\n    \n",
      "type": "blob"
    },
    "child.coffee.md": {
      "path": "child.coffee.md",
      "mode": "100644",
      "content": "A file that exports a value.\n\n    # module.exports = \"CHILD\"\n",
      "type": "blob"
    },
    "test/require.coffee.md": {
      "path": "test/require.coffee.md",
      "mode": "100644",
      "content": "Testing out this crazy require thing\n\n    describe \"require\", ->\n      it \"should exist globally until we bootstrap it\", ->\n        assert window.require\n\n      it \"should be able to require a file that exists\", ->\n        assert window.require('./build.js')\n",
      "type": "blob"
    }
  },
  "distribution": {
    "build.js": {
      "path": "build.js",
      "content": "(function() {\n  var fileSeparator, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, rootModule,\n    __slice = [].slice;\n\n  fileSeparator = '/';\n\n  global = window;\n\n  rootModule = {\n    path: \"\"\n  };\n\n  loadPath = function(parentModule, pkg, path) {\n    var cache, localPath, module, normalizedPath;\n    localPath = parentModule.path.split(fileSeparator);\n    normalizedPath = normalizePath(path, localPath);\n    cache = (pkg.cache || (pkg.cache = {}));\n    module = cache[normalizedPath] || (cache[normalizedPath] = loadModule(normalizedPath, parentModule));\n    return module.exports;\n  };\n\n  normalizePath = function(path, base) {\n    var piece, result;\n    if (base == null) {\n      base = [];\n    }\n    base = base.concat(path.split(fileSeparator));\n    result = [];\n    while (base.length) {\n      switch (piece = base.shift()) {\n        case \"..\":\n          result.pop();\n          break;\n        case \"\":\n        case \".\":\n          break;\n        default:\n          result.push(piece);\n      }\n    }\n    return result.join(fileSeparator);\n  };\n\n  loadPackage = function(parentModule, pkg, path) {\n    path || (path = pkg.entryPoint);\n    return loadPath(parentModule, pkg, path);\n  };\n\n  loadModule = function(pkg, path) {\n    var args, context, module, program, values;\n    console.log(\"Loading module from package \" + pkg + \" at \" + path);\n    program = pkg.distribution[path].content;\n    if (program == null) {\n      throw \"Could not find file: \" + path + \" in package \" + pkg;\n    }\n    module = {\n      path: path,\n      exports: {}\n    };\n    context = {\n      require: function(path) {\n        var otherPackage, packagePath;\n        if (otherPackage = isPackage(path)) {\n          packagePath = path.replace(otherPackage, \"\");\n          return loadPackage(module, pkg.dependencies[otherPackage], packagePath);\n        } else {\n          return loadPath.call(module, pkg, path);\n        }\n      },\n      global: global,\n      module: module,\n      exports: module.exports,\n      __filename: path,\n      __dirname: path.split(fileSeparator).slice(0, -1)\n    };\n    args = Object.keys(context);\n    values = args.map(function(name) {\n      return context[name];\n    });\n    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);\n    return module;\n  };\n\n  isPackage = function(path) {\n    if (!(path.startsWith(fileSeparator) || path.startsWith(\".\" + fileSeparator) || path.startsWith(\"..\" + fileSeparator))) {\n      return path.split(fileSeparator)[0];\n    } else {\n      return false;\n    }\n  };\n\n  if (typeof module !== \"undefined\" && module !== null) {\n    module.exports = function(path) {\n      return loadPath(rootModule, path);\n    };\n  } else {\n    this.require = function(path) {\n      return loadPath(rootModule, ENV.root, path);\n    };\n  }\n\n}).call(this);\n;(function() {\n\n\n}).call(this);\n;(function() {\n\n\n}).call(this);",
      "type": "blob"
    },
    "test.js": {
      "path": "test.js",
      "content": "(function() {\n  var fileSeparator, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, rootModule,\n    __slice = [].slice;\n\n  fileSeparator = '/';\n\n  global = window;\n\n  rootModule = {\n    path: \"\"\n  };\n\n  loadPath = function(parentModule, pkg, path) {\n    var cache, localPath, module, normalizedPath;\n    localPath = parentModule.path.split(fileSeparator);\n    normalizedPath = normalizePath(path, localPath);\n    cache = (pkg.cache || (pkg.cache = {}));\n    module = cache[normalizedPath] || (cache[normalizedPath] = loadModule(normalizedPath, parentModule));\n    return module.exports;\n  };\n\n  normalizePath = function(path, base) {\n    var piece, result;\n    if (base == null) {\n      base = [];\n    }\n    base = base.concat(path.split(fileSeparator));\n    result = [];\n    while (base.length) {\n      switch (piece = base.shift()) {\n        case \"..\":\n          result.pop();\n          break;\n        case \"\":\n        case \".\":\n          break;\n        default:\n          result.push(piece);\n      }\n    }\n    return result.join(fileSeparator);\n  };\n\n  loadPackage = function(parentModule, pkg, path) {\n    path || (path = pkg.entryPoint);\n    return loadPath(parentModule, pkg, path);\n  };\n\n  loadModule = function(pkg, path) {\n    var args, context, module, program, values;\n    console.log(\"Loading module from package \" + pkg + \" at \" + path);\n    program = pkg.distribution[path].content;\n    if (program == null) {\n      throw \"Could not find file: \" + path + \" in package \" + pkg;\n    }\n    module = {\n      path: path,\n      exports: {}\n    };\n    context = {\n      require: function(path) {\n        var otherPackage, packagePath;\n        if (otherPackage = isPackage(path)) {\n          packagePath = path.replace(otherPackage, \"\");\n          return loadPackage(module, pkg.dependencies[otherPackage], packagePath);\n        } else {\n          return loadPath.call(module, pkg, path);\n        }\n      },\n      global: global,\n      module: module,\n      exports: module.exports,\n      __filename: path,\n      __dirname: path.split(fileSeparator).slice(0, -1)\n    };\n    args = Object.keys(context);\n    values = args.map(function(name) {\n      return context[name];\n    });\n    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);\n    return module;\n  };\n\n  isPackage = function(path) {\n    if (!(path.startsWith(fileSeparator) || path.startsWith(\".\" + fileSeparator) || path.startsWith(\"..\" + fileSeparator))) {\n      return path.split(fileSeparator)[0];\n    } else {\n      return false;\n    }\n  };\n\n  if (typeof module !== \"undefined\" && module !== null) {\n    module.exports = function(path) {\n      return loadPath(rootModule, path);\n    };\n  } else {\n    this.require = function(path) {\n      return loadPath(rootModule, ENV.root, path);\n    };\n  }\n\n}).call(this);\n;(function() {\n\n\n}).call(this);\n;(function() {\n\n\n}).call(this);\n;;(function() {\n  describe(\"require\", function() {\n    it(\"should exist globally until we bootstrap it\", function() {\n      return assert(window.require);\n    });\n    return it(\"should be able to require a file that exists\", function() {\n      return assert(window.require('./build.js'));\n    });\n  });\n\n}).call(this);",
      "type": "blob"
    }
  },
  "repository": {
    "full_name": "STRd6/require",
    "branch": "master"
  },
  "progenitor": {
    "url": "http://strd6.github.io/editor/"
  }
}));