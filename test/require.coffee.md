Testing out this crazy require thing

    # Load our latest require code for testing
    # NOTE: This causes the root for relative requires to be at the root dir, not the test dir
    latestRequire = require('/main').generateFor(PACKAGE)
    
    # TODO: Remove this once the editor is up to date with the latest
    delete global.require

    describe "require", ->
      it "should not exist globally", ->
        assert !global.require

      it "should be able to require a file that exists with a relative path", ->
        assert latestRequire('/terminal')
        
      it "should get whatever the file exports", ->
        assert latestRequire('/terminal').something
      
      it "should not get something the file doesn't export", ->
        assert !latestRequire('/terminal').something2

      it "should be able to require from the root path within a package", ->
        assert latestRequire('/main')

      it "should throw a descriptive error when requring circular dependencies", ->
        assert.throws ->
          latestRequire('/circular')
        , /circular/i

      it "should throw a descriptive error when requiring a package that doesn't exist", ->
        assert.throws ->
          latestRequire "does_not_exist"
        , /not found/i

      it "should throw a descriptive error when requiring a relative path that doesn't exist", ->
        assert.throws ->
          latestRequire "/does_not_exist"
        , /Could not find file/i

    describe "module context", ->
      it "should know __dirname", ->
        assert.equal "test", __dirname

      it "should know __filename", ->
        assert.equal "test/require", __filename

      it "should know its package", ->
        assert PACKAGE
