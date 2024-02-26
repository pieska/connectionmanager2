Connection Manager for GNOME 45
=========================

Connection Manager was written by [Stefano Ciancio](https://github.com/sciancio) as a copy of [sshmenu](http://sshmenu.sourceforge.net/) from GNOME 2. Sadly, he lost interest in maintaining the extension after GNOME 3.32 on May 2019. Other maintainers have continued to provide updates to this extension over the years. 

This repository includes an update that supports GNOME 45.

What is Connection Manager
========================

Connection Manager (CM) is a GNOME Shell extension that add an icon to top bar panel. It provides a menu for initiating SSH/Telnet connections and for launch any system and custom application (rdesktop, top, etc.)

Based on sshmenu software of Grant McLean (http://sshmenu.sourceforge.net/)

What it looks like?
========================

Some screenshot

![CM extension](http://i.imgur.com/W3PjE.png)

![CM Preferences](http://i.imgur.com/kC64i.png)

![CM Search](http://i.imgur.com/VOfHQ.png)


Why
========================

Since moving to Fedora 15 and Gnome Shell, I’ve missed the [sshmenu](http://sshmenu.sourceforge.net/) applet a lot. I have used it intensively and so I decided to rewrite it for Gnome 3.


How to install
========================

Download the zip file to $HOME/.local/share/gnome-shell/extensions
and unpack it. A directory called connectionmanager2-master should 
be created. Rename it to connectionmanager2@ciancio.net.

For use by all users, install in /usr/share/gnome-shell/extensions.

Restart your GNOME shell (Alt-F2 r is one way) and enable the
extension using gnome-tweak-tool (install it if not present).

If the extension does not install, check the version number in
metadate.json. You may have to change it to work with your
particular version of the GNOME Shell. If this does not fix
the problem, use Looking Glass (Alt-F2 lg) to see what the
error message is.

You can also install from [Gnome Shell Extension site](https://extensions.gnome.org/extension/699/connection-manager/)

Current Version
========================

Release 0.8.2 [Changes](https://github.com/sciancio/connectionmanager/wiki/Changes)

Other Info
========================

You can find other info: 

* [GitHub wiki](https://github.com/sciancio/connectionmanager/wiki)
* [Gnome Shell Extension](https://extensions.gnome.org/extension/699/connection-manager/)
* [GitHub](https://github.com/sciancio/connectionmanager)
* [License](https://github.com/sciancio/connectionmanager/wiki/License)




