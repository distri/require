(function (ENV) {
(function() {
  var Module, cache, fileSeparator, isPackage, loadFileContent, normalizePath, require,
    __slice = [].slice;

  Module = function(id, parent) {
    var self;
    self = {
      children: [],
      id: id,
      exports: {},
      filename: null,
      loaded: false,
      parent: parent
    };
    if (parent != null) {
      parent.children.push(self);
    }
    return self;
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Module;
  } else {
    this.Module = Module;
  }

  cache = {};

  fileSeparator = '/';

  require = function(path) {
    var localPath, normalizedPath, parent;
    parent = this;
    if (isPackage(path)) {
      return {};
    }
    localPath = parent.filename.split(fileSeparator).slice(0, -1);
    normalizedPath = normalizePath(path, localPath);
    return loadFileContent(normalizedPath);
  };

  normalizePath = function(path, base) {
    var first, piece, pieces, rest, _ref;
    if (base == null) {
      base = [];
    }
    _ref = pieces = path.split(fileSeparator), first = _ref[0], rest = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
    if (first === "") {
      base = [];
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
    }
  };

  loadFileContent = function(path) {
    var content;
    content = ENV.distribution[path];
    if (content != null) {
      return content;
    } else {
      throw "Could not find file: " + path;
    }
  };

  isPackage = function(path) {
    return !(path.startsWith('/') || path.startsWith('./') || path.startsWith('../'));
  };

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
      "content": "Require\n=======\n\nA Node.js compatible require implementation for pure client side apps.\n\nEach file is a module. Modules are responsible for exporting an object. Unlike\ntraditional client side JavaScript, Ruby, or other common languages the module\nis not responsible for naming its product in the context of the requirer. This\nmaintains encapsulation because it is impossible from within a module to know\nwhat external name would be correct to prevent errors of composition in all\npossible uses.\n\nImplementation\n--------------\n\nA simple translation of the Node.js module creator, keeping the same interface.\n\n    Module = (id, parent) ->\n      self =\n        children: []\n        id: id\n        exports: {}\n        filename: null\n        loaded: false\n        parent: parent\n        \n      parent?.children.push(self)\n        \n      return self\n\nTransitional style of exports, if `module` exists because we are using a module\nsystem then export in that manner, otherwise we are not using a module system\nand must export our own global reference.\n\n    if module?\n      module.exports = Module\n    else\n      @Module = Module\n\nKeep a cache of loaded modules so that multiple calls to the same name return\nthe same module.\n\n    cache = {}\n    \nFile separator is '/'\n\n    fileSeparator = '/'\n    \nRequire a module based on a path. Each file is its own separate module.\n\n    require = (path) ->\n      parent = this\n      \n      if isPackage(path)\n        # TODO\n        return {}\n      \n      localPath = parent.filename.split(fileSeparator)[0...-1]\n      normalizedPath = normalizePath(path, localPath)\n      \n      loadFileContent(normalizedPath)\n      \nTo normalize the path we convert local paths to a standard form that does not\ncontain an references to current or parent directories.\n\n    normalizePath = (path, base=[]) ->\n      [first, rest...] = pieces = path.split(fileSeparator)\n\nUse the first part of the path to determine if we are looking up an absolute\npath.\n\n      if first is \"\"\n        base = []\n\nChew up all the pieces into a standardized path.\n\n        while pieces.length\n          switch piece = pieces.shift()\n            when \"..\"\n              base.pop()\n            when \"\", \".\"\n              # Skip\n            else\n              base.push(piece)\n              \n        return base.join(fileSeparator)\n\nLoad a file from within our package.\n\n    loadFileContent = (path) ->\n      content = ENV.distribution[path]\n      \n      if content?\n        return content\n      else\n        throw \"Could not find file: #{path}\"\n\nTODO: Package loading\n\n    isPackage = (path) ->\n      !(path.startsWith('/') or\n        path.startsWith('./') or\n        path.startsWith('../')\n      )\n\nNode needs to check file extensions, but because we have a compile step we are\nable to compile all files extensionlessly based only on their path. So while\nNode may need to check for either `path/somefile.js` or `path/somefile.coffee` \nthat will already have been resolved for us and we will only check \n`path/somefile`\n\n",
      "type": "blob"
    }
  },
  "distribution": {
    "build.js": {
      "path": "build.js",
      "content": "(function() {\n  var Module, cache, fileSeparator, isPackage, loadFileContent, normalizePath, require,\n    __slice = [].slice;\n\n  Module = function(id, parent) {\n    var self;\n    self = {\n      children: [],\n      id: id,\n      exports: {},\n      filename: null,\n      loaded: false,\n      parent: parent\n    };\n    if (parent != null) {\n      parent.children.push(self);\n    }\n    return self;\n  };\n\n  if (typeof module !== \"undefined\" && module !== null) {\n    module.exports = Module;\n  } else {\n    this.Module = Module;\n  }\n\n  cache = {};\n\n  fileSeparator = '/';\n\n  require = function(path) {\n    var localPath, normalizedPath, parent;\n    parent = this;\n    if (isPackage(path)) {\n      return {};\n    }\n    localPath = parent.filename.split(fileSeparator).slice(0, -1);\n    normalizedPath = normalizePath(path, localPath);\n    return loadFileContent(normalizedPath);\n  };\n\n  normalizePath = function(path, base) {\n    var first, piece, pieces, rest, _ref;\n    if (base == null) {\n      base = [];\n    }\n    _ref = pieces = path.split(fileSeparator), first = _ref[0], rest = 2 <= _ref.length ? __slice.call(_ref, 1) : [];\n    if (first === \"\") {\n      base = [];\n      while (pieces.length) {\n        switch (piece = pieces.shift()) {\n          case \"..\":\n            base.pop();\n            break;\n          case \"\":\n          case \".\":\n            break;\n          default:\n            base.push(piece);\n        }\n      }\n      return base.join(fileSeparator);\n    }\n  };\n\n  loadFileContent = function(path) {\n    var content;\n    content = ENV.distribution[path];\n    if (content != null) {\n      return content;\n    } else {\n      throw \"Could not find file: \" + path;\n    }\n  };\n\n  isPackage = function(path) {\n    return !(path.startsWith('/') || path.startsWith('./') || path.startsWith('../'));\n  };\n\n}).call(this);",
      "type": "blob"
    },
    "test.js": {
      "path": "test.js",
      "content": "(function() {\n  var Module, cache, fileSeparator, isPackage, loadFileContent, normalizePath, require,\n    __slice = [].slice;\n\n  Module = function(id, parent) {\n    var self;\n    self = {\n      children: [],\n      id: id,\n      exports: {},\n      filename: null,\n      loaded: false,\n      parent: parent\n    };\n    if (parent != null) {\n      parent.children.push(self);\n    }\n    return self;\n  };\n\n  if (typeof module !== \"undefined\" && module !== null) {\n    module.exports = Module;\n  } else {\n    this.Module = Module;\n  }\n\n  cache = {};\n\n  fileSeparator = '/';\n\n  require = function(path) {\n    var localPath, normalizedPath, parent;\n    parent = this;\n    if (isPackage(path)) {\n      return {};\n    }\n    localPath = parent.filename.split(fileSeparator).slice(0, -1);\n    normalizedPath = normalizePath(path, localPath);\n    return loadFileContent(normalizedPath);\n  };\n\n  normalizePath = function(path, base) {\n    var first, piece, pieces, rest, _ref;\n    if (base == null) {\n      base = [];\n    }\n    _ref = pieces = path.split(fileSeparator), first = _ref[0], rest = 2 <= _ref.length ? __slice.call(_ref, 1) : [];\n    if (first === \"\") {\n      base = [];\n      while (pieces.length) {\n        switch (piece = pieces.shift()) {\n          case \"..\":\n            base.pop();\n            break;\n          case \"\":\n          case \".\":\n            break;\n          default:\n            base.push(piece);\n        }\n      }\n      return base.join(fileSeparator);\n    }\n  };\n\n  loadFileContent = function(path) {\n    var content;\n    content = ENV.distribution[path];\n    if (content != null) {\n      return content;\n    } else {\n      throw \"Could not find file: \" + path;\n    }\n  };\n\n  isPackage = function(path) {\n    return !(path.startsWith('/') || path.startsWith('./') || path.startsWith('../'));\n  };\n\n}).call(this);",
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