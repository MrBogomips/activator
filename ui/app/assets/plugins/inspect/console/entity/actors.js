/*
 Copyright (C) 2013 Typesafe, Inc <http://typesafe.com>
 */
define(['text!./actors.html', 'core/pluginapi', '../widget', '../format', '../hover'], function(template, api, ConsoleWidget, format) {

  var ko = api.ko;

  var Actors = api.Class(ConsoleWidget, {
    id: 'console-actors-widget',
    template: template,
    init: function(args) {
      var self = this;
      this.columns = [
        { 'name': 'Actor', 'sortBy': 'actor' },
        { 'name': 'Throughput', 'sortBy': 'throughput' },
        { 'name': 'Max Mailbox Time', 'sortBy': 'maxTimeInMailbox' },
        { 'name': 'Max Mailbox Size', 'sortBy': 'maxMailboxSize' },
        { 'name': 'Deviations', 'sortBy': 'deviation' }
      ];
      this.sortBy = ko.observable('actor');
      this.changeSort = function(column) {
        self.sortBy(column.sortBy);
      };
      this.data = ko.observable({ 'actors': [], 'total': 0 });
      this.total = ko.computed(function() {
        return self.data().total;
      });
      this.limit = ko.observable('50');
      this.hideAnonymous = ko.observable(true);
      this.fullActorPath = ko.observable(true);
      this.filter = ko.observable('');
      this.clearFilter = function() {
        self.filter('');
      };
      this.actors = ko.computed(function() {
        var data = self.data().actors;
        var fullPath = self.fullActorPath();
        var hideAnonymous = self.hideAnonymous();
        var filter = self.filter();
        var actors = [];
        var formatUnits = function(u, v) { return format.shorten(v) + ' ' + u };
        for (var i = 0; i < data.length; i++) {
          var a = data[i];
          var path = a.scope.actorPath;
          var elements = path.split('/');
          var name = elements.pop();
          var prefix = fullPath ? elements : [];
          var hover = fullPath ? '' : path;
          var messageRate = a.totalMessageRate || 0;
          var throughput = format.units('messages/second', messageRate, formatUnits);
          var maxTimeInMailbox = format.units(a.maxTimeInMailboxUnit, a.maxTimeInMailbox, formatUnits);
          var maxMailboxSize = a.maxMailboxSize;
          var deviationCount = a.errorCount + a.warningCount + a.deadLetterCount + a.unhandledMessageCount;
          var deviations = deviationCount > 0 ? deviationCount : "";
          var actor = {
            'path': path,
            'prefix': prefix,
            'name': name,
            'hover': hover,
            'throughput': throughput,
            'maxTimeInMailbox': maxTimeInMailbox,
            'maxMailboxSize': maxMailboxSize,
            'deviations': deviations
          };
          var show = true;
          if (hideAnonymous && name.charAt(0) == '$') show = false;
          if (filter.length > 0) {
            var filters = filter.toLowerCase().split(' ');
            var matchWith = fullPath ? path.toLowerCase() : name.toLowerCase();
            for (var j = 0; j < filters.length; j++) {
              if (matchWith.indexOf(filters[j]) < 0) show = false;
            }
          }
          if (show) actors.push(actor);
        }
        return actors;
      });
    },
    dataName: 'actors',
    dataTypes: ['actors'],
    dataRequest: function() {
      sortBy = this.sortBy();
      if (sortBy == "actor") {
        sortBy = this.fullActorPath() ? "actorPath" : "actorName";
      }
      return {
        'sortCommand': sortBy,
        'paging': { 'offset': 0, 'limit': parseInt(this.limit(), 10) }
      };
    },
    onData: function(data) {
      this.data(data.actors);
    }
  });

  return Actors;
});
