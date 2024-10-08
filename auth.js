'use strict';

const debug = require('debug')('ea:auth');
debug.log = console.log.bind(console);

const passport = require('passport');
const { Strategy: CookieStrategy } = require('passport-cookie');
const { getStaffModel } = require('./db/models');
const express = require('express');
const i18next = require('i18next');


// Auth with staff cookie. TODO: time bound?
passport.use('staff-cookie',
new CookieStrategy({
    cookieName: 'staff',
    passReqToCallback: true,
    signed: true
},
async (req, token, cb)=>{
    try {
        debug('cb. signedCookies: ', req.signedCookies);
        let email = req.signedCookies.staff; // email
        let staffModel = getStaffModel();
        let staff = await staffModel.findOne({email}, {password: 0});
        if (!staff) return cb(null, false, {errMsg: i18next.t("account_not_exist")});
        // ensure signup has been completed, i.e emailConfirmed field set
        if (!staff.emailConfirmed) return cb(null, false, {errMsg: i18next.t("account_not_exist")});
        //
        return cb(null, staff);
    } catch (exc) {
        debug('staff cookie auth exc: ', exc);
        return cb(null, false, exc);
    }
})
);


// TODO: Data Entry role, data approval




// Data Master
passport.use('data-master-cookie',
new CookieStrategy({
    cookieName: 'staff',
    passReqToCallback: true,
    signed: true
    },
    async (req, token, cb)=>{
        try {
            // debug('cb. signedCookies: ', req.signedCookies);
            // debug('session: ', req.session);
            let email = req.session.email; // signedCookies email
            let staffModel = getStaffModel();
            let staff = await staffModel.findOne({email}, {password: 0});
            if (!staff) {
                debug('staff falsy. Will callback with failure message');
                return cb(null, false, {errMsg: i18next.t("account_not_exist") });
            }
            // ensure signup has been completed, i.e emailConfirmed field set
            if (!staff.emailConfirmed) return cb(null, false, {errMsg: i18next.t("account_not_exist")});
            // Ensure the admin has the correct data master role to perform action
            if (!staff.roles?.dataMaster) {
                return cb(null, false, {errMsg: i18next.t("no_role_permission")});
            }
            // Ensure the admin has the right scope permission (TODO in different middleware)
            return cb(null, staff);
        } catch (exc) {
            debug('staff cookie auth exc: ', exc);
            return cb(null, false, exc);
        }
    }
));
