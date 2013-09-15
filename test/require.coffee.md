Testing out this crazy require thing

    describe "require", ->
      it "should exist globally until we bootstrap it", ->
        assert window.require

      it "should be able to require a file that exists", ->
        assert window.require('./main')

      it "should be able to require from the root path within a package", ->
        assert require('/main')
