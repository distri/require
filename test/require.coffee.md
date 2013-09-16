Testing out this crazy require thing

    # Load our latest require code for testing
    o = {}
    Function(ENV.distribution.main.content).call(o)
    require = o.require

    describe "require", ->
      it "should exist globally until we bootstrap it", ->
        assert window.require

      it "should be able to require a file that exists", ->
        assert window.require('./main')

      it "should be able to require from the root path within a package", ->
        console.log "require /main"
        assert require('/main')
