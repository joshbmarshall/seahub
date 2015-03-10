define([
    'jquery',
    'underscore',
    'backbone',
    'common',
    'jquery.ui.tabs',
    'select2',
    'text!' + app.config._tmplRoot + 'share-popup.html',
], function($, _, Backbone, Common, Tabs, Select2, SharePopupTemplate) {
    'use strict';

    var SharePopupView = Backbone.View.extend({
        tagName: 'div',
        id: 'share-popup',
        template: _.template(SharePopupTemplate),

        initialize: function(options) {
            this.is_repo_owner = options.is_repo_owner;
            this.is_virtual = options.is_virtual;
            this.user_perm = options.user_perm;
            this.repo_id = options.repo_id;
            this.dirent_path = options.dirent_path;
            this.obj_name = options.obj_name;
            this.is_dir = options.is_dir;

            this.render();
            this.$el.modal({
                appendTo: "#main",
                focus: false,
                containerCss: {"padding": 0}
            });
            $('#simplemodal-container').css({'width':'auto', 'height':'auto'});
            this.$("#share-tabs").tabs();

            // check if 'download link' exists, decide 'download link' panel's content
            this.checkDownloadLink();
        },

        render: function () {
            this.$el.html(this.template({
                title: gettext("Share {placeholder}")
                    .replace('{placeholder}', '<span class="op-target">' + this.obj_name + '</span>'),
                is_dir: this.is_dir,
                is_repo_owner: this.is_repo_owner,
                is_virtual: this.is_virtual,
                user_perm: this.user_perm,
                repo_id: this.repo_id,
                //TODO
                cloud_mode: false,
                org: false
            }));

            return this;
        },

        checkDownloadLink: function() {
            // check if downloadLink exists
            // decide the content of 'download link' panel
            var _this = this;
            var after_op_success = function(data) {
                _this.$('.loading-tip').hide();
                if (data['download_link']) {
                    _this.download_link = data["download_link"]; // for 'link send'
                    _this.download_link_token = data["token"]; // for 'link delete'
                    _this.$('#download-link').html(data['download_link']); // TODO:
                    _this.$('#download-link-operations').removeClass('hide');
                } else {
                    _this.$('#generate-download-link-form').removeClass('hide');
                }
            };
            Common.ajaxGet({
                'get_url': Common.getUrl({name: 'get_share_download_link'}), // TODO: name & py
                'data': {
                    'repo_id': this.repo_id,
                    'p': this.dirent_path,
                    'type': this.is_dir ? 'd' : 'f'
                },
                'after_op_success': after_op_success
            });
        },

        events: {
            'mouseenter .checkbox-label': 'highlightCheckbox',
            'mouseleave .checkbox-label': 'rmHighlightCheckbox',
            'click .checkbox-orig': 'clickCheckbox',

            // download link
            'submit #generate-download-link-form': 'generateDownloadLink',
            'click #send-download-link': 'showDownloadLinkSendForm',
            'submit #send-download-link-form': 'sendDownloadLink',
            'click #cancel-share-download-link': 'cancelShareDownloadLink',
            'click #delete-download-link': 'deleteDownloadLink',

            // upload link
            'click #dir-upload-link-share-tab': 'checkUploadLink',
            'submit #generate-upload-link-form': 'generateUploadLink',
            'click #send-upload-link': 'showUploadLinkSendForm',
            'submit #send-upload-link-form': 'sendUploadLink',
            'click #cancel-share-upload-link': 'cancelShareUploadLink',
            'click #delete-upload-link': 'deleteUploadLink',
            
            // file private share    
            'click #file-private-share-tab': 'showFilePrivateSharePanel',
            'submit #file-private-share-form': 'filePrivateShare',

            // dir private share    
            'click #dir-private-share-tab': 'showDirPrivateSharePanel',
            'submit #dir-private-share-form': 'dirPrivateShare'
        },

        highlightCheckbox: function () {
            var el = event.target || event.srcElement;
            $(el).addClass('hl');
        },

        rmHighlightCheckbox: function () {
            var el = event.target || event.srcElement;
            $(el).removeClass('hl');
        },

        clickCheckbox: function() {
            var el = event.target || event.srcElement;
            $(el).parent().toggleClass('checkbox-checked');
            // for link options such as 'password', 'expire'
            $(el).closest('.checkbox-label').next().toggleClass('hide');
        },

        generateDownloadLink: function() {
            var form = this.$('#generate-download-link-form'),
                form_id = form.attr('id'),
                use_passwd = $('[name="use_passwd"]', form).attr('checked'),
                set_expiration = $('[name="set_expiration"]', form).attr('checked');
            var post_data = {};

            console.log($('[name="use_passwd"]', form));
            console.log(use_passwd);// undefined. TODO: debug

            if (use_passwd) {
                var passwd = $.trim($('[name="password"]', form).val()),
                    passwd_again = $.trim($('[name="password_again"]', form).val());
                if (!passwd) {
                    Common.showFormError(form_id, gettext("Please enter password"));
                    return false;
                }
                /*
                if (passwd.length < {{repo_password_min_length}}) { // TODO: min_length
                    Common.showFormError(form_id, gettext("Password is too short"));
                    return false;
                }
                */
                if (!passwd_again) {
                    Common.showFormError(form_id, gettext("Please enter the password again"));
                    return false;
                }
                if (passwd != passwd_again) {
                    Common.showFormError(form_id, gettext("Passwords don't match"));
                    return false;
                }
                post_data["use_passwd"] = 1;
                post_data["passwd"] = passwd;
            } else {
                post_data["use_passwd"] = 0;
            }

            if (set_expiration) {
                var expire_days = $.trim($('[name="expire_days"]', form).val());
                if (!expire_days) {
                    Common.showFormError(form_id, gettext("Please enter days."));
                    return false;
                }
                if (Math.floor(expire_days) != expire_days || !$.isNumeric(expire_days)) {
                    Common.showFormError(form_id, gettext("Please enter valid days"));
                    return false;
                };
                post_data["expire_days"] = expire_days;
            }

            var gen_btn = $('[type="submit"]', form);
            Common.disableButton(gen_btn);

            $.extend(post_data, {
                'repo_id': this.repo_id,
                'type': this.is_dir? 'd' : 'f',
                'p': this.dirent_path
            });

            var _this = this;
            var after_op_success = function(data) {
                form.addClass('hide');
                // TODO: restore link options state
                Common.enableButton(gen_btn);
                _this.$('#download-link').html(data["download_link"]); // TODO: add 'click & select' func
                _this.download_link = data["download_link"]; // for 'link send'
                _this.download_link_token = data["token"]; // for 'link delete'
                _this.$('#download-link-operations').removeClass('hide');
            };

            Common.ajaxPost({
                'form': form,
                'post_url': Common.getUrl({name: 'get_share_download_link'}),
                'post_data': post_data,
                'after_op_success': after_op_success,
                'form_id': form_id
            });
            return false;
        },

        showDownloadLinkSendForm: function() {
            this.$('#send-download-link, #delete-download-link').addClass('hide');
            this.$('#send-download-link-form').removeClass('hide');
            // no addAutocomplete for email input
        },

        sendLink: function(options) {
            // options: {form:$obj, other_post_data:{}, post_url:''}  // TODO: better writing
            var form = options.form,
                form_id = form.attr('id'),
                email = $.trim($('[name="email"]', form).val()),
                extra_msg = $('textarea[name="extra_msg"]', form).val();

            if (!email) {
                Common.showFormError(form_id, gettext("Please input at least an email."));
                return false;
            };
            
            var submit_btn = $('[type="submit"]', form);
            var sending_tip = $('.sending-tip', form);
            Common.disableButton(submit_btn);
            sending_tip.removeClass('hide');

            var post_data = {
                email: email,
                extra_msg: extra_msg
            };
            $.extend(post_data, options.other_post_data);

            var after_op_success = function(data) {
                $.modal.close();
                Common.feedback(data['msg'], 'success', Common.SUCCESS_TIMOUT);
            };
            var after_op_error = function() {
                sending_tip.addClass('hide');
                Common.enableButton(submit_btn);
                // TODO: improve
                Common.showFormError(form_id, gettext('Error'));
            };

            Common.ajaxPost({
               'form': form,
               'post_url': options.post_url,
               'post_data': post_data,
               'after_op_success': after_op_success,
               'after_op_error': after_op_error,
               'form_id': form_id
            });
        },

        sendDownloadLink: function() {
            this.sendLink({
                form: this.$('#send-download-link-form'),
                other_post_data: {
                    file_shared_link: this.download_link,
                    file_shared_name: this.obj_name,
                    file_shared_type: this.is_dir ? 'd' : 'f' 
                },
                post_url: Common.getUrl({name: 'send_shared_download_link'})
            });            
            return false;
        },

        cancelShareDownloadLink: function() {
            this.$('#send-download-link, #delete-download-link').removeClass('hide');
            this.$('#send-download-link-form').addClass('hide');
        },

        deleteDownloadLink: function() {
            var _this = this;
            var after_op_success = function(data) {
                _this.$('#generate-download-link-form').removeClass('hide'),
                _this.$('#download-link-operations').addClass('hide');
            };
            Common.ajaxGet({
                'get_url': Common.getUrl({name: 'delete_shared_download_link'}),
                'data': { 't': _this.download_link_token },
                'after_op_success': after_op_success
            });
        },

        checkUploadLink: function() {
            // check if upload link exists

            var _this = this;
            var after_op_success = function(data) {
                if (data['upload_link']) {
                    _this.upload_link_token = data["token"];
                    _this.upload_link = data["upload_link"];
                    _this.$('#upload-link').html(data["upload_link"]); // TODO
                    _this.$('#upload-link-operations').removeClass('hide');
                } else {
                    _this.$('#generate-upload-link-form').removeClass('hide');
                }
            };
            Common.ajaxGet({
                'get_url': Common.getUrl({name: 'get_share_upload_link'}), // TODO
                'data': {'repo_id': this.repo_id, 'p': this.dirent_path},
                'after_op_success': after_op_success
            });
        },

        generateUploadLink: function(e) {
            var form = this.$('#generate-upload-link-form'),
                form_id = form.attr('id'),
                use_passwd = $('[name="use_passwd"]', form).attr('checked');
            var post_data = {};

            if (use_passwd) {
                var passwd = $.trim($('[name="password"]', form).val()),
                    passwd_again = $.trim($('[name="password_again"]', form).val());
                if (!passwd) {
                    Common.showFormError(form_id, gettext("Please enter password"));
                    return false;
                }
                /*
                if (passwd.length < {{repo_password_min_length}}) { // TODO: min_length
                    Common.showFormError(form_id, gettext("Password is too short"));
                    return false;
                }
                */
                if (!passwd_again) {
                    Common.showFormError(form_id, gettext("Please enter the password again"));
                    return false;
                }
                if (passwd != passwd_again) {
                    Common.showFormError(form_id, gettext("Passwords don't match"));
                    return false;
                }
                post_data["use_passwd"] = 1;
                post_data["passwd"] = passwd;
            } else {
                post_data["use_passwd"] = 0;
            }

            var gen_btn = $('[type="submit"]', form);
            Common.disableButton(gen_btn);

            $.extend(post_data, {
                'repo_id': this.repo_id,
                'p': this.dirent_path
            });

            var _this = this;
            var after_op_success = function(data) {
                form.addClass('hide');
                // TODO: restore link options state
                Common.enableButton(gen_btn);
                _this.$('#upload-link').html(data["upload_link"]); // TODO: add 'click & select' func
                _this.download_link = data["upload_link"]; // for 'link send'
                _this.download_link_token = data["token"]; // for 'link delete'
                _this.$('#upload-link-operations').removeClass('hide');
            };

            Common.ajaxPost({ // TODO: check 'error'
                'form': form,
                'post_url': Common.getUrl({name: 'get_share_upload_link'}), // TODO: check py
                'post_data': post_data,
                'after_op_success': after_op_success,
                'form_id': form_id
            });
            return false;
        },

        showUploadLinkSendForm: function() {
            this.$('#send-upload-link, #delete-upload-link').addClass('hide');
            this.$('#send-upload-link-form').removeClass('hide');
            // no addAutocomplete for email input
        },

        sendUploadLink: function() {
            this.sendLink({
                form: this.$('#send-upload-link-form'),
                other_post_data: {
                    shared_upload_link: this.upload_link
                },
                post_url: Common.getUrl({name: 'send_shared_upload_link'})
            });            
            return false;
        },

        cancelShareUploadLink: function() {
            this.$('#send-upload-link, #delete-upload-link').removeClass('hide');
            this.$('#send-upload-link-form').addClass('hide');
        },

        deleteUploadLink: function() {
            var _this = this;
            var after_op_success = function(data) {
                _this.$('#generate-upload-link-form').removeClass('hide'),
                _this.$('#upload-link-operations').addClass('hide');
            };
            Common.ajaxGet({
                'get_url': Common.getUrl({name: 'delete_shared_upload_link'}),
                'data': { 't': _this.upload_link_token },
                'after_op_success': after_op_success
            });
        },

        showFilePrivateSharePanel: function() {
            var loading_tip = this.$('.loading-tip');
            var form = this.$('#file-private-share-form');
            loading_tip.show();

            var contacts = app.pageOptions.contacts || [];
            var opts = '', email;
            for (var i = 0, len = contacts.length; i < len; i++) {
                email = contacts[i].email;
                opts += '<option value="' + email + '" data-index="' + i + '">' + email + '</option>';
            }
            var format = function(item) {
                return contacts[$(item.element).data('index')].avatar + '<span class="vam">' + item.text + '</span>';
            };
            $('[name="emails"]', form).html(opts).select2({
                placeholder: gettext("Select contacts or input"),
                width: 'element',
                tags: true,
                tokenSeparators: [',', ' '], // TODO: ??
                formatResult: format,
                formatSelection: format,
                escapeMarkup: function(m) { return m; }
            });
           
            loading_tip.hide(); 
            form.removeClass('hide');
        },

        filePrivateShare: function () {
            var form = this.$('#file-private-share-form'),
                form_id = form.attr('id');

            var post_emails = "",
                emails = $('[name="emails"]', form).val();
            if (!emails) {
                Common.showFormError(form_id, gettext("It is required."));
                return false;
            }
            for (var i = 0, len = emails.length; i < len; i++) {
                post_emails += emails[i] + ',';
            }

            var post_data = {
                'repo_id': this.repo_id,
                'path': this.dirent_path,
                'emails': post_emails
            };
            var post_url = Common.getUrl({name: 'private_share_file'});
            // TODO: modify seahub/share/views.py 'ajax_private_share_file'
            // TODO: add feedback in js
            var after_op_success = function (data) {
                $.modal.close();
            };

            Common.ajaxPost({
                'form': form,
                'post_url': post_url,
                'post_data': post_data,
                'after_op_success': after_op_success,
                'form_id': form_id
            });
            return false;
        },

        showDirPrivateSharePanel: function() {
            var loading_tip = this.$('.loading-tip');
            var form = this.$('#dir-private-share-form');
            loading_tip.show();

            var contacts = app.pageOptions.contacts || [];
            var c_opts = '', email;
            for (var i = 0, len = contacts.length; i < len; i++) {
                email = contacts[i].email;
                c_opts += '<option value="' + email + '" data-index="' + i + '">' + email + '</option>';
            }
            var c_format = function(item) {
                return contacts[$(item.element).data('index')].avatar + '<span class="vam">' + item.text + '</span>';
            };
            $('[name="emails"]', form).html(c_opts).select2({
                placeholder: gettext("Select contacts or input"),
                tags: true,
                tokenSeparators: [',', ' '], // TODO: ??
                formatResult: c_format,
                formatSelection: c_format,
                escapeMarkup: function(m) { return m; }
            });
           
            var groups = app.pageOptions.groups || [];
            var g_opts = '';
            for (var i = 0, len = groups.length; i < len; i++) {
                g_opts += '<option value="' + groups[i].id + '" data-index="' + i + '">' + groups[i].name + '</option>';
            }
            var g_format = function(item) {
                return groups[$(item.element).data('index')].avatar + '<span class="vam">' + item.text + '</span>';
            };
            $('[name="groups"]', form).html(g_opts).select2({
                tags: true,
                tokenSeparators: [',', ' '],
                placeholder: gettext("Select groups or Input"),
                formatResult: g_format,
                formatSelection: g_format,
                escapeMarkup: function(m) { return m; }
            });

            loading_tip.hide(); 
            form.removeClass('hide');
        },

        dirPrivateShare: function () {
            var form = this.$('#dir-private-share-form'),
                form_id = form.attr('id');

            var post_groups = "",
                groups = $('[name="groups"]', form).val(),
                post_emails = "",
                emails = $('[name="emails"]', form).val();

            if (!emails && !groups) {
                Common.showFormError(form_id, gettext("Please select or input at least one people or group."));
                return false;
            }

            var post_data = {
                'repo_id': this.repo_id,
                'path': this.dirent_path
            };
            if (groups) {
                for (var i = 0, len = groups.length; i < len; i++){
                    post_groups += groups[i] + ',';
                }
                post_data['groups'] = post_groups;
            }
            if (emails) {
                for (var i = 0, len = emails.length; i < len; i++){
                    post_emails += emails[i] + ',';
                }
                post_data['emails'] = post_emails;
            }
            post_data['perm'] = $('[name="permission"]', form).val();
            var post_url = Common.getUrl({name: 'private_share_dir'});
            // TODO: check 'private_share_dir' in seahub/share/views.py
            // add feedback in js
            var after_op_success = function(data) {
                $.modal.close();
            };

            Common.ajaxPost({
                'form': form,
                'post_url': post_url,
                'post_data': post_data,
                'after_op_success': after_op_success,
                'form_id': form_id
            });
            return false;
        }
    });

    return SharePopupView;
});
