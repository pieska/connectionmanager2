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

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// const Lang = imports.lang;
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
const Me = Extension.lookupByURL(import.meta.url);


import * as Config from 'resource:///org/gnome/shell/misc/config.js';

// SSH / Apps Search Provider
export class SearchProvider {
    constructor(extension) {
        this._extension = extension;
    }

    // The application of the provider. Extensions will usually return `null`.
    get appInfo() {
        return null;
    }

    // Whether the provider offers detailed results.
    // Extensions will usually return `false`.
    get canLaunchSearch() {
        return false;
    }

    // The unique ID of the provider.
    get id() {
        return this._extension.uuid;
    }

    // This method is called when a search provider result is activated.
    activateResult(result, terms) {
        console.debug(`activateResult(${result}, [${terms}])`);
        Util.spawnCommandLine(this.sshNames[result-1].command);
    }

    getResultMetas (resultIds, callback) {
        let app = null;

        const {scaleFactor} = St.ThemeContext.get_for_stage(global.stage);

        return new Promise((resolve, reject) => {
            const cancelledId = cancellable.connect(
                () => reject(Error('Operation Cancelled')));

            const metas = [];

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

            cancellable.disconnect(cancelledId);
            if (!cancellable.is_cancelled())
                resolve(resultMetas);
        });
    }
}
export class SshSearchProvider {
    constructor(extension) {
        this._extension = extension;
        this.sshNames = [];
    }

    /**
     * The application of the provider.
     *
     * Applications will return a `Gio.AppInfo` representing themselves.
     * Extensions will usually return `null`.
     *
     * @type {Gio.AppInfo}
     */
    get appInfo() {
        return null;
    }

    /**
     * Whether the provider offers detailed results.
     *
     * Applications will return `true` if they have a way to display more
     * detailed or complete results. Extensions will usually return `false`.
     *
     * @type {boolean}
     */
    get canLaunchSearch() {
        return false;
    }

    /**
     * The unique ID of the provider.
     *
     * Applications will return their application ID. Extensions will usually
     * return their UUID.
     *
     * @type {string}
     */
    get id() {
        return this._extension.uuid;
    }

    // Update list of SSH/Apps on configuration changes
    _update (sshNames) {
        this.sshNames = sshNames;
    }

    filterResults(providerResults, maxResults) {
        return providerResults;
    }

    createResultObject(result, terms) {
        return null;
    }

    getInitialResultSet(terms, callback) {
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
    }

    getSubsearchResultSet(previousResults, terms, callback) {
        this.getInitialResultSet(terms, callback);
    }

    getResultMetas(resultIds, callback) {
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
    }

    activateResult(id) {
        Util.spawnCommandLine(this.sshNames[id-1].command);
    }
}

