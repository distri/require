Testing out this crazy require thing

    # Load our latest require code for testing
    # require = global.require('/main').generateFor(PACKAGE)

    describe "require", ->
      it "should exist globally until we bootstrap it", ->
        assert !global.require

      it "should be able to require a file that exists with a relative path", ->
        assert require('../main')

      it "should be able to require from the root path within a package", ->
        assert require('/main')

    describe "module context", ->
      it "should know __dirname", ->
        assert.equal "test", __dirname
        
      it "should know __filename", ->
        assert.equal "test/require", __filename
        
      it "should know its package", ->
        assert PACKAGE
