Testing out this crazy require thing

    # Load our latest require code for testing
    # require = global.require('/main').generateFor(PACKAGE)

    describe "require", ->
      it "should not exist globally", ->
        assert !global.require

      it "should be able to require a file that exists with a relative path", ->
        assert require('../terminal')
        
      it "should get whatever the file exports", ->
        assert require('../terminal').something
      
      it "should not get something the file doesn't export", ->
        assert !require('../terminal').something2

      it "should be able to require from the root path within a package", ->
        assert require('/main')

      it "should throw a descriptive error when requring circular dependencies", ->
        assert.throws ->
          require('./circular')

      it "should throw a descriptive error when requiring a package that doesn't exist", ->
      
      it "should throw a descriptive error when requiring a non-existent file within an external package", ->
      
      it "should throw a descriptive error when requiring a relative path that doesn't exist", ->

    describe "module context", ->
      it "should know __dirname", ->
        assert.equal "test", __dirname
        
      it "should know __filename", ->
        assert.equal "test/require", __filename
        
      it "should know its package", ->
        assert PACKAGE
