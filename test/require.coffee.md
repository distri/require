Testing out this crazy require thing

    # Load our latest require code for testing
    # NOTE: This causes the root for relative requires to be at the root dir, not the test dir
    latestRequire = require('/main').generateFor(PACKAGE)

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
        result = require("/samples/random")

        assert.equal require("/samples/random"), result

    describe "module context", ->
      it "should know __dirname", ->
        assert.equal "test", __dirname

      it "should know __filename", ->
        assert __filename

      it "should know its package", ->
        assert PACKAGE

    describe "dependent packages", ->
      PACKAGE.dependencies["test-package"] =
        distribution:
          main:
            content: ""

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

      it "should be able to require by pretty much any name", ->
        assert latestRequire("strange/name")
