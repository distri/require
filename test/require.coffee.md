Testing out this crazy require thing

    describe "require", ->
      it "should exist globally until we bootstrap it", ->
        assert window.require
