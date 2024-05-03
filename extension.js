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
import Gdk from 'gi://Gdk';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';

import * as Signals from 'resource:///org/gnome/shell/misc/signals.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Panel from 'resource:///org/gnome/shell/ui/panel.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';

let ByteArrayReplacement = new TextDecoder('utf-8');

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
let extensionPath;
let extensionObject, extensionSettings;
let CM = Extension.lookupByURL(import.meta.url);
let Me = Extension.lookupByURL(import.meta.url);

// Import Command Terminal Manager and Search class
import * as Search from './search.js'
import * as Terminals from './terminals.js';

class ConnectionManager extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    constructor() {

        super(1, "Connection Manager", false);

        this.CM = Extension.lookupByURL(import.meta.url);

        let box = new St.BoxLayout();

        let icon = new St.Icon({ gicon: Gio.icon_new_for_string(this.CM.path + '/emblem-cm-symbolic.svg'),
                                             icon_size: 15 });

        let bin = new St.Bin({child: icon});

        box.add_child(bin);

        this.add_child(box);
        this.add_style_class_name('panel-status-button');

        let CMPrefs = this.CM.metadata;

        this._configFile = GLib.build_filenamev([GLib.get_home_dir(), CMPrefs['sw_config']]);
        this._prefFile = GLib.build_filenamev([extensionPath, CMPrefs['sw_bin']]) + " " + extensionPath;

        this._readConf();
    }


    _readConf() {

        this.menu.removeAll();

        // Rewrite _setOpenedSubMenu method to correctly open submenu
            this.menu._setOpenedSubMenu = submenu => {
            this._openedSubMenu = submenu;
        }

        this._sshList = [];

        if (GLib.file_test(this._configFile, GLib.FileTest.EXISTS) ) {

            let filedata = GLib.file_get_contents(this._configFile);
            let jsondata = JSON.parse(ByteArrayReplacement.decode(filedata[1]));
            let root = jsondata['Root'];

            // Global Settings
            if (typeof(jsondata.Global) == 'undefined') {
                jsondata.Global = '';
            };

            this._menu_open_tabs = !(/^false$/i.test(jsondata.Global.menu_open_tabs));
            this._menu_open_windows = !(/^false$/i.test(jsondata.Global.menu_open_windows));
            this._terminal = jsondata.Global.terminal;

            // TerminalCommand class
            if (this.TermCmd) {delete this.TermCmd; }
            this.TermCmd = new Terminals.TerminalCommand(this._terminal);

            this._readTree(root, this, "");

        } else {
            console.error("CONNMGR: Error reading config file " + this._configFile);
            let filedata = null
        }

        let menuSepPref = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(menuSepPref, this.menu.length);

        let menuPref = new PopupMenu.PopupMenuItem("Connection Manager Settings");
        menuPref.connect('activate', () => {
            Util.trySpawnCommandLine('python ' + this._prefFile);
        });
        this.menu.addMenuItem(menuPref, this.menu.length+1);
    }


    _readTree(node, parent, ident) {

        let child, menuItem, menuSep, menuSub, icon, label,
            menuItemAll, iconAll, menuSepAll, menuItemTabs, iconTabs, ident_prec;
        let childHasItem = false, commandAll = new Array(), commandTab = new Array(),
            sshparamsTab = new Array(), itemnr = 0;

        // For each child ...
        for (let i = 0; i < node.length; i++) {
            child = node[i][0];
            let command;

            if (child.hasOwnProperty('Type')) {

                // Simple Item
                if (child.Type == '__item__') {

                    menuItem = new PopupMenu.PopupBaseMenuItem();

                    icon = new St.Icon({icon_name: 'terminal',
                            style_class: 'connmgr-icon' });
                    menuItem.add_child(icon);

                    label = new St.Label({ text: ident+child.Name });
                    menuItem.add_child(label);

                    // For each command ...
                    this.TermCmd.resetEnv();
                    this.TermCmd.setChild(child);
                    command = this.TermCmd.createCmd();
                    this.TermCmd.resetEnv();
                    let [commandT, sshparamsT] = this.TermCmd.createTabCmd();

                    menuItem.connect('activate', function() {
                        Util.spawnCommandLine(command);
                    });
                    parent.menu.addMenuItem(menuItem, i);

                    childHasItem = true;
                    if (this._menu_open_windows) { commandAll[itemnr] = command; }
                    if (this._menu_open_tabs) {
                        commandTab[itemnr] = commandT;
                        sshparamsTab[itemnr] = sshparamsT;
                    }
                    itemnr++;

                    // Add ssh entry in search array
                    this._sshList.push(
                        {
                            'type': child.Type,
                            'terminal': this.TermCmd.get_terminal(),
                            'name': child.Name+' - '+child.Host,
                            'command': command
                        }
                    );
                }

                // Application Item
                if (child.Type == '__app__') {

                    menuItem = new PopupMenu.PopupBaseMenuItem();
                    icon = new St.Icon({icon_name: 'gtk-execute',
                            style_class: 'connmgr-icon' });
                    menuItem.add_child(icon);

                    label = new St.Label({ text: ident+child.Name });
                    menuItem.add_child(label);

                    // For each command ...
                    this.TermCmd.resetEnv();
                    this.TermCmd.setChild(child);
                    command = this.TermCmd.createCmd();
                    this.TermCmd.resetEnv();
                    let [commandT, sshparamsT] = this.TermCmd.createTabCmd();

                    menuItem.connect('activate', function() {
                        Util.spawnCommandLine(command);
                    });
                    parent.menu.addMenuItem(menuItem, i);

                    childHasItem = true;
                    if (this._menu_open_windows) { commandAll[itemnr] = command; }
                    if (this._menu_open_tabs) {
                        commandTab[itemnr] = commandT;
                        sshparamsTab[itemnr] = sshparamsT;
                    }
                    itemnr++;

                    // Add ssh entry in search array
                    this._sshList.push(
                        {
                            'type': child.Type,
                            'terminal': this.TermCmd.get_terminal(),
                            'name': child.Name+' - '+child.Host,
                            'command': command
                        }

                    );
                }

                // Separator
                if (child.Type == '__sep__') {
                    parent.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(), i);
                }

                // Folder
                if (child.Type == '__folder__') {

                    menuSub = new PopupMenu.PopupSubMenuMenuItem(ident+child.Name);
                    parent.menu.addMenuItem(menuSub);

                    ident_prec = ident;
                    this._readTree(child.Children, menuSub, ident+"  ");

                }
            }
        }

        let position = 0;
        if (childHasItem) {

            if (( this._menu_open_windows) && (this.TermCmd.supportWindows()) ){
                menuItemAll = new PopupMenu.PopupBaseMenuItem();
                iconAll = new St.Icon({icon_name: 'fileopen',
                                style_class: 'connmgr-icon' });
                menuItemAll.add_child(iconAll);

                label = new St.Label({ text: ident+"Open all windows" });
                menuItemAll.add_child(label);

                parent.menu.addMenuItem(menuItemAll, position);
                position += 1;
                menuItemAll.connect('activate', function() { 
                    for (let c = 0; c < commandAll.length; c++) {
                        Util.spawnCommandLine(commandAll[c]);
                    }
                });
            }

            if ( (this._menu_open_tabs) && (this.TermCmd.supportTabs()) ) {
                menuItemTabs = new PopupMenu.PopupBaseMenuItem();
                iconTabs = new St.Icon({icon_name: 'fileopen',
                                style_class: 'connmgr-icon' });
                menuItemTabs.add_child(iconTabs);

                label = new St.Label({ text: ident+"Open all as tabs" });
                menuItemTabs.add_child(label);

                parent.menu.addMenuItem(menuItemTabs, position);
                position += 1;

                let term = this.TermCmd.get_terminal();

                menuItemTabs.connect('activate', function() { 
                    // Generate command to open all commandTab items in a single tabbed gnome-terminal
                    let mycommand='';

                    for (let c = 0; c < commandTab.length; c++) {
                        mycommand += commandTab[c]+' ';
                    }

                    Util.spawnCommandLine(' sh -c '+JSON.stringify(sshparamsTab[0]+' '+term+' '+mycommand)+' &');
                });
            }

            menuSepAll = new PopupMenu.PopupSeparatorMenuItem();
            parent.menu.addMenuItem(menuSepAll, position);

        }
        ident = ident_prec;
    }

}


let cm;

export default class ConnectionManagerExtension extends Extension {

    enable() {

        // extensionPath = extensionMeta.path;
        extensionObject = Extension.lookupByUUID('connectionmanager2@ciancio.net');
        // extensionSettings = extensionObject.getSettings();
        extensionPath = extensionObject.path;

        let theme = St.IconTheme.new();

        this.cm = new ConnectionManager();

        let _children_length = Main.panel._rightBox.get_n_children();
        Main.panel.addToStatusArea("connectionmanager", this.cm, _children_length - 2, "right");

        let file = Gio.file_new_for_path(this.cm._configFile);
        this.cm.monitor = file.monitor(Gio.FileMonitorFlags.NONE, null);
        this.cm.monitor.connect('changed', () => this.cm._readConf());

        this._searchProvider = new Search.SearchProvider(this);
        Main.overview.searchController.addProvider(this._searchProvider);
    }

    disable() {
        Main.overview.searchController.removeProvider(this._searchProvider);
        this._searchProvider = null;

        this.cm.monitor.cancel();
        this.cm.destroy();
    }
}

