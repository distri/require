(function (ENV) {
(function() {
  var cache, fileSeparator, global, isPackage, loadModule, normalizePath, require, rootModule,
    __slice = [].slice;

  cache = {};

  fileSeparator = '/';

  global = window;

  rootModule = {
    path: ""
  };

  require = function(path) {
    var localPath, module, normalizedPath, parent;
    parent = this;
    console.log(parent);
    if (isPackage(path)) {
      return {};
    }
    localPath = parent.path.split(fileSeparator);
    normalizedPath = normalizePath(path, localPath);
    module = cache[normalizedPath] || (cache[normalizedPath] = loadModule(normalizedPath, parent));
    return module.exports;
  };

  normalizePath = function(path, base) {
    var first, piece, pieces, rest, _ref;
    if (base == null) {
      base = [];
    }
    _ref = pieces = path.split(fileSeparator), first = _ref[0], rest = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
    while (pieces.length) {
      switch (piece = pieces.shift()) {
        case "..":
          base.pop();
          break;
        case "":
        case ".":
          break;
        default:
          base.push(piece);
      }
    }
    return base.join(fileSeparator);
  };

  loadModule = function(path) {
    var args, context, module, program, values;
    console.log("Loading module at " + path);
    program = ENV.distribution[path].content;
    if (program == null) {
      throw "Could not find file: " + path;
    }
    module = {
      path: path,
      exports: {}
    };
    context = {
      ENV: ENV,
      require: function(path) {
        return require.call(module, path);
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
    return !(path.startsWith('/') || path.startsWith('./') || path.startsWith('../'));
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = function(path) {
      return require.call(rootModule, path);
    };
  } else {
    this.require = function(path) {
      return require.call(rootModule, path);
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
      "content": "Require\n=======\n\nA Node.js compatible require implementation for pure client side apps.\n\nEach file is a module. Modules are responsible for exporting an object. Unlike\ntraditional client side JavaScript, Ruby, or other common languages the module\nis not responsible for naming its product in the context of the requirer. This\nmaintains encapsulation because it is impossible from within a module to know\nwhat external name would be correct to prevent errors of composition in all\npossible uses.\n\nImplementation\n--------------\n\nKeep a cache of loaded modules so that multiple calls to the same name return\nthe same module.\n\n    cache = {}\n    \nFile separator is '/'\n\n    fileSeparator = '/'\n\nBecause we're in the browser window is global.\n\n    global = window\n\nA top-level module so that all other modules won't have to be orphans.\n\n    rootModule =\n      path: \"\"\n\nRequire a module based on a path. Each file is its own separate module.\n\n    require = (path) ->\n      parent = this\n      \n      console.log parent\n\n      if isPackage(path)\n        # TODO\n        return {}\n\n      localPath = parent.path.split(fileSeparator)\n\n      normalizedPath = normalizePath(path, localPath)\n      \n      module = \n        cache[normalizedPath] ||= loadModule(normalizedPath, parent)\n\n      return module.exports\n\nTo normalize the path we convert local paths to a standard form that does not\ncontain an references to current or parent directories.\n\n    normalizePath = (path, base=[]) ->\n      [first, rest...] = pieces = path.split(fileSeparator)\n\nChew up all the pieces into a standardized path.\n\n      while pieces.length\n        switch piece = pieces.shift()\n          when \"..\"\n            base.pop()\n          when \"\", \".\"\n            # Skip\n          else\n            base.push(piece)\n            \n      return base.join(fileSeparator)\n\nLoad a file from within our package.\n\n    loadModule = (path) ->\n      console.log \"Loading module at #{path}\"\n      program = ENV.distribution[path].content\n\n      throw \"Could not find file: #{path}\" unless program?\n\n      module =\n        path: path\n        exports: {}\n\n      context =\n        ENV: ENV\n        require: (path) -> \n          require.call(module, path)\n        global: global\n        module: module\n        exports: module.exports\n        __filename: path\n        __dirname: path.split(fileSeparator)[0...-1]\n      \n      args = Object.keys(context)\n      values = args.map (name) -> context[name]\n\n      Function(args..., program).apply(module, values)\n\n      return module\n\nTODO: Package loading\n\n    isPackage = (path) ->\n      !(path.startsWith('/') or\n        path.startsWith('./') or\n        path.startsWith('../')\n      )\n\nNode needs to check file extensions, but because we have a compile step we are\nable to compile all files extensionlessly based only on their path. So while\nNode may need to check for either `path/somefile.js` or `path/somefile.coffee` \nthat will already have been resolved for us and we will only check \n`path/somefile`\n\nTransitional style of exports, if `module` exists because we are using a module\nsystem then export in that manner, otherwise we are not using a module system\nand must export our own global reference.\n\n    if module?\n      module.exports = (path) ->\n        require.call(rootModule, path)\n    else\n      @require = (path) ->\n        require.call(rootModule, path)\n",
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
      "content": "(function() {\n  var cache, fileSeparator, global, isPackage, loadModule, normalizePath, require, rootModule,\n    __slice = [].slice;\n\n  cache = {};\n\n  fileSeparator = '/';\n\n  global = window;\n\n  rootModule = {\n    path: \"\"\n  };\n\n  require = function(path) {\n    var localPath, module, normalizedPath, parent;\n    parent = this;\n    console.log(parent);\n    if (isPackage(path)) {\n      return {};\n    }\n    localPath = parent.path.split(fileSeparator);\n    normalizedPath = normalizePath(path, localPath);\n    module = cache[normalizedPath] || (cache[normalizedPath] = loadModule(normalizedPath, parent));\n    return module.exports;\n  };\n\n  normalizePath = function(path, base) {\n    var first, piece, pieces, rest, _ref;\n    if (base == null) {\n      base = [];\n    }\n    _ref = pieces = path.split(fileSeparator), first = _ref[0], rest = 2 <= _ref.length ? __slice.call(_ref, 1) : [];\n    while (pieces.length) {\n      switch (piece = pieces.shift()) {\n        case \"..\":\n          base.pop();\n          break;\n        case \"\":\n        case \".\":\n          break;\n        default:\n          base.push(piece);\n      }\n    }\n    return base.join(fileSeparator);\n  };\n\n  loadModule = function(path) {\n    var args, context, module, program, values;\n    console.log(\"Loading module at \" + path);\n    program = ENV.distribution[path].content;\n    if (program == null) {\n      throw \"Could not find file: \" + path;\n    }\n    module = {\n      path: path,\n      exports: {}\n    };\n    context = {\n      ENV: ENV,\n      require: function(path) {\n        return require.call(module, path);\n      },\n      global: global,\n      module: module,\n      exports: module.exports,\n      __filename: path,\n      __dirname: path.split(fileSeparator).slice(0, -1)\n    };\n    args = Object.keys(context);\n    values = args.map(function(name) {\n      return context[name];\n    });\n    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);\n    return module;\n  };\n\n  isPackage = function(path) {\n    return !(path.startsWith('/') || path.startsWith('./') || path.startsWith('../'));\n  };\n\n  if (typeof module !== \"undefined\" && module !== null) {\n    module.exports = function(path) {\n      return require.call(rootModule, path);\n    };\n  } else {\n    this.require = function(path) {\n      return require.call(rootModule, path);\n    };\n  }\n\n}).call(this);\n;(function() {\n\n\n}).call(this);\n;(function() {\n\n\n}).call(this);",
      "type": "blob"
    },
    "test.js": {
      "path": "test.js",
      "content": "(function() {\n  var cache, fileSeparator, global, isPackage, loadModule, normalizePath, require, rootModule,\n    __slice = [].slice;\n\n  cache = {};\n\n  fileSeparator = '/';\n\n  global = window;\n\n  rootModule = {\n    path: \"\"\n  };\n\n  require = function(path) {\n    var localPath, module, normalizedPath, parent;\n    parent = this;\n    console.log(parent);\n    if (isPackage(path)) {\n      return {};\n    }\n    localPath = parent.path.split(fileSeparator);\n    normalizedPath = normalizePath(path, localPath);\n    module = cache[normalizedPath] || (cache[normalizedPath] = loadModule(normalizedPath, parent));\n    return module.exports;\n  };\n\n  normalizePath = function(path, base) {\n    var first, piece, pieces, rest, _ref;\n    if (base == null) {\n      base = [];\n    }\n    _ref = pieces = path.split(fileSeparator), first = _ref[0], rest = 2 <= _ref.length ? __slice.call(_ref, 1) : [];\n    while (pieces.length) {\n      switch (piece = pieces.shift()) {\n        case \"..\":\n          base.pop();\n          break;\n        case \"\":\n        case \".\":\n          break;\n        default:\n          base.push(piece);\n      }\n    }\n    return base.join(fileSeparator);\n  };\n\n  loadModule = function(path) {\n    var args, context, module, program, values;\n    console.log(\"Loading module at \" + path);\n    program = ENV.distribution[path].content;\n    if (program == null) {\n      throw \"Could not find file: \" + path;\n    }\n    module = {\n      path: path,\n      exports: {}\n    };\n    context = {\n      ENV: ENV,\n      require: function(path) {\n        return require.call(module, path);\n      },\n      global: global,\n      module: module,\n      exports: module.exports,\n      __filename: path,\n      __dirname: path.split(fileSeparator).slice(0, -1)\n    };\n    args = Object.keys(context);\n    values = args.map(function(name) {\n      return context[name];\n    });\n    Function.apply(null, __slice.call(args).concat([program])).apply(module, values);\n    return module;\n  };\n\n  isPackage = function(path) {\n    return !(path.startsWith('/') || path.startsWith('./') || path.startsWith('../'));\n  };\n\n  if (typeof module !== \"undefined\" && module !== null) {\n    module.exports = function(path) {\n      return require.call(rootModule, path);\n    };\n  } else {\n    this.require = function(path) {\n      return require.call(rootModule, path);\n    };\n  }\n\n}).call(this);\n;(function() {\n\n\n}).call(this);\n;(function() {\n\n\n}).call(this);\n;;(function() {\n  describe(\"require\", function() {\n    it(\"should exist globally until we bootstrap it\", function() {\n      return assert(window.require);\n    });\n    return it(\"should be able to require a file that exists\", function() {\n      return assert(window.require('./build.js'));\n    });\n  });\n\n}).call(this);",
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