Testing out this crazy require thing

    # Load our latest require code for testing
    # NOTE: This causes the root for relative requires to be at the root dir, not the test dir
    latestRequire = require('/main').generateFor(PACKAGE)

    describe "PACKAGE", ->
      it "should be named 'ROOT'", ->
        assert.equal PACKAGE.name, "ROOT"

    describe "require", ->
      it "should not exist globally", ->
        assert !global.require

      it "should be able to require a file that exists with a relative path", ->
        assert latestRequire('/samples/terminal')

      it "should get whatever the file exports", ->
        assert latestRequire('/samples/terminal').something

      it "should not get something the file doesn't export", ->
        assert !latestRequire('/samples/terminal').something2

      it "should throw a descriptive error when requring circular dependencies", ->
        assert.throws ->
          latestRequire('/samples/circular')
        , /circular/i

      it "should throw a descriptive error when requiring a package that doesn't exist", ->
        assert.throws ->
          latestRequire "does_not_exist"
        , /not found/i

      it "should throw a descriptive error when requiring a relative path that doesn't exist", ->
        assert.throws ->
          latestRequire "/does_not_exist"
        , /Could not find file/i

      it "should recover gracefully enough from requiring files that throw errors", ->
        assert.throws ->
          latestRequire "/samples/throws"

        assert.throws ->
          latestRequire "/samples/throws"
        , (err) ->
          !/circular/i.test err

      it "should cache modules", ->
        result = latestRequire("/samples/random")

        assert.equal latestRequire("/samples/random"), result

      it "should be able to require a JSON package object", ->
        SAMPLE_PACKAGE =
          entryPoint: "main"
          distribution:
            main:
              content: "module.exports = require('./other')"
            other:
              content: "module.exports = 'TEST'"

        result = latestRequire SAMPLE_PACKAGE

        assert.equal "TEST", result

    describe "package wrapper", ->
      it "should be able to generate a package wrapper", ->
        assert require('/main').executePackageWrapper(PACKAGE)

      it "should be able to execute code in the package context", ->
        assert require('/main').packageWrapper(PACKAGE, "my_codezz")

    describe "public API", ->
      it "should be able to require a JSON package directly", ->
        assert require('/main').require(PACKAGE).require

    describe "module context", ->
      it "should know __dirname", ->
        assert.equal "test", __dirname

      it "should know __filename", ->
        assert __filename

      it "should know its package", ->
        assert PACKAGE

    describe "malformed package", ->
      malformedPackage =
        distribution:
          yolo: "No content!"

      it "should throw an error when attempting to require a malformed file in a package distribution", ->
        r = require('/main').generateFor(malformedPackage)

        assert.throws ->
          r.require "yolo"
        , (err) ->
          !/malformed/i.test err

    describe "dependent packages", ->
      PACKAGE.dependencies["test-package"] =
        distribution:
          main:
            content: "module.exports = PACKAGE.name"

      PACKAGE.dependencies["strange/name"] =
        distribution:
          main:
            content: ""

      it "should raise an error when requiring a package that doesn't exist", ->
        assert.throws ->
          latestRequire "nonexistent"
        , (err) ->
          /nonexistent/i.test err

      it "should be able to require a package that exists", ->
        assert latestRequire("test-package")

      it "Dependent packages should know their names when required", ->
        assert.equal latestRequire("test-package"), "test-package"

      it "should be able to require by pretty much any name", ->
        assert latestRequire("strange/name")
