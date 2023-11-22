//   ConnectionManager 3 - Simple GUI app for Gnome 3 that provides a menu 
//   for initiating SSH/Telnet/Custom Apps connections. 
//   Copyright (C) 2011  Stefano Ciancio
//
//   This library is free software; you can redistribute it and/or
//   modify it under the terms of the GNU Library General Public
//   License as published by the Free Software Foundation; either
//   version 2 of the License, or (at your option) any later version.
//
//   This library is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
//   Library General Public License for more details.
//
//   You should have received a copy of the GNU Library General Public
//   License along with this library; if not, write to the Free Software
//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

import St from 'gi://St';
import Gio from 'gi://Gio';

import Shell from 'gi://Shell';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';

// const Lang = imports.lang;
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
let Me = Extension.lookupByURL(import.meta.url);

/*
  "Lang" is no longer available. Just removing it for now.
  When the replacement code goes in, I'll remove this comment.
  const Lang = imports.lang;
*/

const Me = imports.misc.extensionUtils.getCurrentExtension();

/*
  The code above should be the replacement for these two lines.
  Keeping these in a comment for now. (See extension.js)
  const Me = imports.misc.extensionUtils.getCurrentExtension();
*/

import * as Config from 'resource:///org/gnome/shell/misc/config.js';
/*
  The above line should replace this one.
  But there are now TWO config paths. I chose one, but I'm not sure I made the right choice.
  const Config = imports.misc.config;
*/

// SSH / Apps Search Provider
var SshSearchProvider = new Lang.Class({
    Name: 'SshSearchProvider',

    _init: function(title) {
        this.id = title;
        this.sshNames = [];
    },

    // Update list of SSH/Apps on configuration changes
    _update: function (sshNames) {
        this.sshNames = sshNames;
    },

    filterResults: function(providerResults, maxResults) {
        return providerResults;
    },

    createResultObject: function(result, terms) {
        return null;
    },

    getInitialResultSet: function(terms, callback) {
        let searching = [];

        for (var i=0; i<this.sshNames.length; i++) {
            for (var j=0; j<terms.length; j++) {
                let pattern = new RegExp(terms[j],"gi");
                if (this.sshNames[i].name.match(pattern)) {
                    // +1 because id 0 breaks search results
                    searching.push(i+1);
                }
            }
        }

        if (typeof callback === "function") {
            callback(searching);
        }
    },

    getSubsearchResultSet: function(previousResults, terms, callback) {
        this.getInitialResultSet(terms, callback);
    },

    getResultMetas: function(resultIds, callback) {
        let metas = [];
        let app = null;

        for (let i=0; i<resultIds.length; i++) {
            let result = this.sshNames[resultIds[i]-1]
            let appSys = Shell.AppSystem.get_default();
            let app = null;

            switch (result.type) {
                case '__app__':
                    app = null;
                    break;
                case '__item__':
                    app = appSys.lookup_app(result.terminal + '.desktop');
                    break;
            }

            metas.push({
                'id': resultIds[i],
                'name': result.name,
                'createIcon': function(size) {
                    let icon = null;
                    let appt = app;

                    if (app)
                        icon = app.create_icon_texture(size);
                    else
                        icon = new St.Icon({ gicon: Gio.icon_new_for_string(Me.path + '/emblem-cm-symbolic.svg'),
                                             icon_size: size });

                    return icon;
                }
            })
        }

        callback(metas);
    },

    activateResult: function(id) {
        Util.spawnCommandLine(this.sshNames[id-1].command);
    },
});
