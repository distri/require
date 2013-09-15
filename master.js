(function() {
  var defaultEntryPoint, fileSeparator, generateRequireFn, global, isPackage, loadModule, loadPackage, loadPath, normalizePath, rootModule,
    __slice = [].slice;

  fileSeparator = '/';

  global = window;

  defaultEntryPoint = "main";

  rootModule = {
    path: ""
  };

  loadPath = function(parentModule, pkg, path) {
    var cache, localPath, module, normalizedPath;
    localPath = parentModule.path.split(fileSeparator);
    normalizedPath = normalizePath(path, localPath);
    cache = (pkg.cache || (pkg.cache = {}));
    module = cache[normalizedPath] || (cache[normalizedPath] = loadModule(pkg, normalizedPath));
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
    path || (path = pkg.entryPoint || defaultEntryPoint);
    return loadPath(parentModule, pkg, path);
  };

  loadModule = function(pkg, path) {
    var args, context, dirname, file, module, program, values;
    if (!(file = pkg.distribution[path])) {
      throw "Could not find file at " + path + " in " + pkg;
    }
    program = file.content;
    dirname = path.split(fileSeparator).slice(0, -1).join(fileSeparator);
    module = {
      path: dirname,
      exports: {}
    };
    context = {
      require: generateRequireFn(module, pkg),
      global: global,
      module: module,
      exports: module.exports,
      __filename: path,
      __dirname: dirname
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

  generateRequireFn = function(module, pkg) {
    return function(path) {
      var otherPackage, otherPackageName, packagePath;
      if (pkg == null) {
        pkg = ENV;
      }
      if (otherPackageName = isPackage(path)) {
        packagePath = path.replace(otherPackageName, "");
        otherPackage = pkg.dependencies[otherPackageName];
        if (!otherPackage) {
          throw "Package: " + otherPackageName + " not found.";
        }
        return loadPackage(rootModule, otherPackage, packagePath);
      } else {
        return loadPath(module, pkg, path);
      }
    };
  };

  this.require = generateRequireFn(rootModule);

}).call(this);
