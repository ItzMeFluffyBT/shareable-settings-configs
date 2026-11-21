// The VPK build copies this ES5-compatible declaration into Panorama before the native adapter.
var SettingsConfigExtra = (function () {
    "use strict";
    var fields = {
        sensitivity: {label:"Mouse sensitivity", category:"Mouse", panelId:"MouseSensitivity", min:0.05, max:8},
        sensitivity_y_scale: {label:"Vertical sensitivity scale", category:"Mouse", panelId:"MouseSensitivityYScale", min:0, max:2},
        zoom_sensitivity_ratio: {label:"Zoom sensitivity ratio", category:"Mouse", panelId:"MouseSensitivityZoom", min:0.03, max:3},
        citadel_use_contextual_ping_wheel_option: {label:"Contextual ping wheel", category:"Communication", panelId:"PingWheelContextualCheckbox", min:0, max:1, integer:true},
        closecaption: {label:"Subtitles", category:"Audio", panelId:"ShowSubtitlesToggle", min:0, max:1, integer:true},
        player_ping_indicator_enabled: {label:"HUD ping indicator", category:"Communication", panelId:"HUDPingIndicator", min:0, max:1, integer:true},
        citadel_shop_search_use_name_only: {label:"Search by item name only", category:"Shop", panelId:"SearchUsesItemNameOnlyCheckbox", min:0, max:1, integer:true},
        citadel_21x9_clamp_hud: {label:"Clamp ultrawide HUD", category:"HUD", panelId:"21x9HUDClamp", min:0, max:1, integer:true},
        fps_max: {label:"Gameplay frame rate limit", category:"Video", panelId:"FpsMaxSlider", min:60, max:1000, integer:true},
        fps_max_ui: {label:"Menu frame rate limit", category:"Video", panelId:"FpsMaxUISlider", min:60, max:1000, integer:true},
        volume: {label:"Master volume", category:"Audio", panelId:"MasterVolume", min:0, max:1, displayScale:100},
        snd_gamevolume: {label:"Game volume", category:"Audio", panelId:"SoundGameVolume", min:0, max:1, displayScale:100},
        snd_musicvolume: {label:"Music volume", category:"Audio", panelId:"SoundMusicVolume", min:0, max:1, displayScale:100},
        snd_voipvolume: {label:"Voice volume", category:"Audio", panelId:"SoundVoiceVolume", min:0, max:2, displayScale:100},
        citadel_camera_hero_fov: {label:"Field of view", category:"Camera", panelId:"CameraFOV", min:75, max:90},
        citadel_mouse_cursor_scale: {label:"Cursor size", category:"Mouse", panelId:"MouseCursorSize", min:0.4, max:3},
        citadel_subtitles_custom_style: {label:"Custom subtitle style", category:"Accessibility", panelId:"CustomSubtitlesToggle", min:0, max:1, integer:true},
        citadel_subtitles_font_size: {label:"Subtitle font size", category:"Accessibility", panelId:"SubtitlesFontSize", min:12, max:32, integer:true},
        citadel_subtitles_background_opacity: {label:"Subtitle background opacity", category:"Accessibility", panelId:"SubtitlesBackgroundOpacity", min:0, max:100, integer:true},
        citadel_subtitles_outline_thickness: {label:"Subtitle outline thickness", category:"Accessibility", panelId:"SubtitlesOutlineThickness", min:0, max:6, integer:true},
        citadel_subtitles_bold_font: {label:"Bold subtitles", category:"Accessibility", panelId:"SubtitlesBoldFont", min:0, max:1, integer:true},
        citadel_subtitles_all_caps: {label:"Uppercase subtitles", category:"Accessibility", panelId:"SubtitlesAllCaps", min:0, max:1, integer:true}
    };
    function record(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }
    function validate(value) {
        if (value == null) return undefined;
        if (!record(value) || value.version !== 1 || !record(value.values) ||
            Object.keys(value).some(function (name) { return name !== "version" && name !== "values"; })) {
            throw new Error("Unsupported preset settings format.");
        }
        var values = {};
        Object.keys(value.values).forEach(function (name) {
            var number = value.values[name], spec = fields[name];
            if (!Object.prototype.hasOwnProperty.call(fields, name) || typeof number !== "number" || !isFinite(number) ||
                number < spec.min || number > spec.max || (spec.integer && Math.floor(number) !== number)) {
                throw new Error("Invalid preset setting: " + name);
            }
            values[name] = number;
        });
        return Object.keys(values).length ? {version:1, values:values} : undefined;
    }
    return {fields:fields, validate:validate};
}());

/* fzstd 0.1.1, https://github.com/101arrowz/fzstd
 * Single-frame decoder with bounded lengths and symbol counts for settings-code previews.

MIT License

Copyright (c) 2020 Arjun Barrett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
function SettingsConfigCreateZstd() {
// Some numerical data is initialized as -1 even when it doesn't need initialization to help the JIT infer types
// aliases for shorter compressed code (most minifers don't do this)
var ab = ArrayBuffer, u8 = Uint8Array, u16 = Uint16Array, i16 = Int16Array, u32 = Uint32Array, i32 = Int32Array;
var slc = function (v, s, e) {
    if (u8.prototype.slice)
        return u8.prototype.slice.call(v, s, e);
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    var n = new u8(e - s);
    n.set(v.subarray(s, e));
    return n;
};
var fill = function (v, n, s, e) {
    if (u8.prototype.fill)
        return u8.prototype.fill.call(v, n, s, e);
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    for (; s < e; ++s)
        v[s] = n;
    return v;
};
var cpw = function (v, t, s, e) {
    if (u8.prototype.copyWithin)
        return u8.prototype.copyWithin.call(v, t, s, e);
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    while (s < e) {
        v[t++] = v[s++];
    }
};
// error codes
var ec = [
    'invalid zstd data',
    'window size too large (>2046MB)',
    'invalid block type',
    'FSE accuracy too high',
    'match distance too far back',
    'unexpected EOF'
];
var err = function (ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
        Error.captureStackTrace(e, err);
    if (!nt)
        throw e;
    return e;
};
var rb = function (d, b, n) {
    var i = 0, o = 0;
    for (; i < n; ++i)
        o |= d[b++] << (i << 3);
    return o;
};
var b4 = function (d, b) { return (d[b] | (d[b + 1] << 8) | (d[b + 2] << 16) | (d[b + 3] << 24)) >>> 0; };
// read Zstandard frame header
var rzfh = function (dat, w) {
    var n3 = dat[0] | (dat[1] << 8) | (dat[2] << 16);
    if (n3 == 0x2FB528 && dat[3] == 253) {
        // Zstandard
        var flg = dat[4];
        //    single segment       checksum             dict flag     frame content flag
        var ss = (flg >> 5) & 1, cc = (flg >> 2) & 1, df = flg & 3, fcf = flg >> 6;
        if (flg & 8)
            err(0);
        // byte
        var bt = 6 - ss;
        // dict bytes
        var db = df == 3 ? 4 : df;
        // dictionary id
        var di = rb(dat, bt, db);
        bt += db;
        // frame size bytes
        var fsb = fcf ? (1 << fcf) : ss;
        // frame source size
        var fss = rb(dat, bt, fsb) + ((fcf == 1) && 256);
        // window size
        var ws = fss;
        if (!ss) {
            // window descriptor
            var wb = 1 << (10 + (dat[5] >> 3));
            ws = wb + (wb >> 3) * (dat[5] & 7);
        }
        if (ws > 2145386496)
            err(1);
        var buf = new u8((w == 1 ? (fss || ws) : w ? 0 : ws) + 12);
        buf[0] = 1, buf[4] = 4, buf[8] = 8;
        return {
            b: bt + fsb,
            y: 0,
            l: 0,
            d: di,
            w: (w && w != 1) ? w : buf.subarray(12),
            e: ws,
            o: new i32(buf.buffer, 0, 3),
            u: fss,
            c: cc,
            m: Math.min(131072, ws)
        };
    }
    else if (((n3 >> 4) | (dat[3] << 20)) == 0x184D2A5) {
        // skippable
        return b4(dat, 4) + 8;
    }
    err(0);
};
// most significant bit for nonzero
var msb = function (val) {
    var bits = 0;
    for (; (1 << bits) <= val; ++bits)
        ;
    return bits - 1;
};
// read finite state entropy
var rfse = function (dat, bt, mal) {
    // table pos
    var tpos = (bt << 3) + 4;
    // accuracy log
    var al = (dat[bt] & 15) + 5;
    if (al > mal)
        err(3);
    // size
    var sz = 1 << al;
    // probabilities symbols  repeat   index   high threshold
    var probs = sz, sym = -1, re = -1, i = -1, ht = sz;
    // optimization: single allocation is much faster
    var buf = new ab(512 + (sz << 2));
    var freq = new i16(buf, 0, 256);
    // same view as freq
    var dstate = new u16(buf, 0, 256);
    var nstate = new u16(buf, 512, sz);
    var bb1 = 512 + (sz << 1);
    var syms = new u8(buf, bb1, sz);
    var nbits = new u8(buf, bb1 + sz);
    while (sym < 255 && probs > 0) {
        var bits = msb(probs + 1);
        var cbt = tpos >> 3;
        // mask
        var msk = (1 << (bits + 1)) - 1;
        var val = ((dat[cbt] | (dat[cbt + 1] << 8) | (dat[cbt + 2] << 16)) >> (tpos & 7)) & msk;
        // mask (1 fewer bit)
        var msk1fb = (1 << bits) - 1;
        // max small value
        var msv = msk - probs - 1;
        // small value
        var sval = val & msk1fb;
        if (sval < msv)
            tpos += bits, val = sval;
        else {
            tpos += bits + 1;
            if (val > msk1fb)
                val -= msv;
        }
        freq[++sym] = --val;
        if (val == -1) {
            probs += val;
            syms[--ht] = sym;
        }
        else
            probs -= val;
        if (!val) {
            do {
                // repeat byte
                var rbt = tpos >> 3;
                re = ((dat[rbt] | (dat[rbt + 1] << 8)) >> (tpos & 7)) & 3;
                tpos += 2;
                sym += re;
                if (sym > 255) err(0);
            } while (re == 3);
        }
    }
    if (sym > 255 || probs)
        err(0);
    var sympos = 0;
    // sym step (coprime with sz - formula from zstd source)
    var sstep = (sz >> 1) + (sz >> 3) + 3;
    // sym mask
    var smask = sz - 1;
    for (var s = 0; s <= sym; ++s) {
        var sf = freq[s];
        if (sf < 1) {
            dstate[s] = -sf;
            continue;
        }
        // This is split into two loops in zstd to avoid branching, but as JS is higher-level that is unnecessary
        for (i = 0; i < sf; ++i) {
            syms[sympos] = s;
            do {
                sympos = (sympos + sstep) & smask;
            } while (sympos >= ht);
        }
    }
    // After spreading symbols, should be zero again
    if (sympos)
        err(0);
    for (i = 0; i < sz; ++i) {
        // next state
        var ns = dstate[syms[i]]++;
        // num bits
        var nb = nbits[i] = al - msb(ns);
        nstate[i] = (ns << nb) - sz;
    }
    return [(tpos + 7) >> 3, {
            b: al,
            s: syms,
            n: nbits,
            t: nstate
        }];
};
// read huffman
var rhu = function (dat, bt) {
    //  index  weight count
    var i = 0, wc = -1;
    //    buffer             header byte
    var buf = new u8(292), hb = dat[bt];
    // huffman weights
    var hw = buf.subarray(0, 256);
    // rank count
    var rc = buf.subarray(256, 268);
    // rank index
    var ri = new u16(buf.buffer, 268);
    // NOTE: at this point bt is 1 less than expected
    if (hb < 128) {
        // end byte, fse decode table
        var _a = rfse(dat, bt + 1, 6), ebt = _a[0], fdt = _a[1];
        bt += hb;
        var epos = ebt << 3;
        // last byte
        var lb = dat[bt];
        if (!lb)
            err(0);
        //  state1   state2   state1 bits   state2 bits
        var st1 = 0, st2 = 0, btr1 = fdt.b, btr2 = btr1;
        // fse pos
        // pre-increment to account for original deficit of 1
        var fpos = (++bt << 3) - 8 + msb(lb);
        for (;;) {
            if (wc >= 255) err(0);
            fpos -= btr1;
            if (fpos < epos)
                break;
            var cbt = fpos >> 3;
            st1 += ((dat[cbt] | (dat[cbt + 1] << 8)) >> (fpos & 7)) & ((1 << btr1) - 1);
            hw[++wc] = fdt.s[st1];
            fpos -= btr2;
            if (fpos < epos)
                break;
            cbt = fpos >> 3;
            st2 += ((dat[cbt] | (dat[cbt + 1] << 8)) >> (fpos & 7)) & ((1 << btr2) - 1);
            hw[++wc] = fdt.s[st2];
            btr1 = fdt.n[st1];
            st1 = fdt.t[st1];
            btr2 = fdt.n[st2];
            st2 = fdt.t[st2];
        }
        if (++wc > 255)
            err(0);
    }
    else {
        wc = hb - 127;
        for (; i < wc; i += 2) {
            var byte = dat[++bt];
            hw[i] = byte >> 4;
            hw[i + 1] = byte & 15;
        }
        ++bt;
    }
    // weight exponential sum
    var wes = 0;
    for (i = 0; i < wc; ++i) {
        var wt = hw[i];
        // bits must be at most 11, same as weight
        if (wt > 11)
            err(0);
        wes += wt && (1 << (wt - 1));
    }
    // max bits
    var mb = msb(wes) + 1;
    // table size
    var ts = 1 << mb;
    // remaining sum
    var rem = ts - wes;
    // must be power of 2
    if (rem & (rem - 1))
        err(0);
    hw[wc++] = msb(rem) + 1;
    for (i = 0; i < wc; ++i) {
        var wt = hw[i];
        ++rc[hw[i] = wt && (mb + 1 - wt)];
    }
    // huf buf
    var hbuf = new u8(ts << 1);
    //    symbols                      num bits
    var syms = hbuf.subarray(0, ts), nb = hbuf.subarray(ts);
    ri[mb] = 0;
    for (i = mb; i > 0; --i) {
        var pv = ri[i];
        fill(nb, i, pv, ri[i - 1] = pv + rc[i] * (1 << (mb - i)));
    }
    if (ri[0] != ts)
        err(0);
    for (i = 0; i < wc; ++i) {
        var bits = hw[i];
        if (bits) {
            var code = ri[bits];
            fill(syms, i, code, ri[bits] = code + (1 << (mb - bits)));
        }
    }
    return [bt, {
            n: nb,
            b: mb,
            s: syms
        }];
};
// Tables generated using this:
// https://gist.github.com/101arrowz/a979452d4355992cbf8f257cbffc9edd
// default literal length table
var dllt = /*#__PURE__*/ rfse(/*#__PURE__*/ new u8([
    81, 16, 99, 140, 49, 198, 24, 99, 12, 33, 196, 24, 99, 102, 102, 134, 70, 146, 4
]), 0, 6)[1];
// default match length table
var dmlt = /*#__PURE__*/ rfse(/*#__PURE__*/ new u8([
    33, 20, 196, 24, 99, 140, 33, 132, 16, 66, 8, 33, 132, 16, 66, 8, 33, 68, 68, 68, 68, 68, 68, 68, 68, 36, 9
]), 0, 6)[1];
// default offset code table
var doct = /*#__PURE__ */ rfse(/*#__PURE__*/ new u8([
    32, 132, 16, 66, 102, 70, 68, 68, 68, 68, 36, 73, 2
]), 0, 5)[1];
// bits to baseline
var b2bl = function (b, s) {
    var len = b.length, bl = new i32(len);
    for (var i = 0; i < len; ++i) {
        bl[i] = s;
        s += 1 << b[i];
    }
    return bl;
};
// literal length bits
var llb = /*#__PURE__ */ new u8(( /*#__PURE__ */new i32([
    0, 0, 0, 0, 16843009, 50528770, 134678020, 202050057, 269422093
])).buffer, 0, 36);
// literal length baseline
var llbl = /*#__PURE__ */ b2bl(llb, 0);
// match length bits
var mlb = /*#__PURE__ */ new u8(( /*#__PURE__ */new i32([
    0, 0, 0, 0, 0, 0, 0, 0, 16843009, 50528770, 117769220, 185207048, 252579084, 16
])).buffer, 0, 53);
// match length baseline
var mlbl = /*#__PURE__ */ b2bl(mlb, 3);
// decode huffman stream
var dhu = function (dat, out, hu) {
    var len = dat.length, ss = out.length, lb = dat[len - 1], msk = (1 << hu.b) - 1, eb = -hu.b;
    if (!lb)
        err(0);
    var st = 0, btr = hu.b, pos = (len << 3) - 8 + msb(lb) - btr, i = -1;
    for (; pos > eb && i < ss;) {
        var cbt = pos >> 3;
        var val = (dat[cbt] | (dat[cbt + 1] << 8) | (dat[cbt + 2] << 16)) >> (pos & 7);
        st = ((st << btr) | val) & msk;
        out[++i] = hu.s[st];
        pos -= (btr = hu.n[st]);
    }
    if (pos != eb || i + 1 != ss)
        err(0);
};
// decode huffman stream 4x
// TODO: use workers to parallelize
var dhu4 = function (dat, out, hu) {
    var bt = 6;
    var ss = out.length, sz1 = (ss + 3) >> 2, sz2 = sz1 << 1, sz3 = sz1 + sz2;
    dhu(dat.subarray(bt, bt += dat[0] | (dat[1] << 8)), out.subarray(0, sz1), hu);
    dhu(dat.subarray(bt, bt += dat[2] | (dat[3] << 8)), out.subarray(sz1, sz2), hu);
    dhu(dat.subarray(bt, bt += dat[4] | (dat[5] << 8)), out.subarray(sz2, sz3), hu);
    dhu(dat.subarray(bt), out.subarray(sz3), hu);
};
// read Zstandard block
var rzb = function (dat, st, out) {
    var _a;
    var bt = st.b;
    //    byte 0        block type
    var b0 = dat[bt], btype = (b0 >> 1) & 3;
    st.l = b0 & 1;
    var sz = (b0 >> 3) | (dat[bt + 1] << 5) | (dat[bt + 2] << 13);
    // end byte for block
    var ebt = (bt += 3) + sz;
    if (btype == 1) {
        if (bt >= dat.length)
            return;
        st.b = bt + 1;
        if (out) {
            fill(out, dat[bt], st.y, st.y += sz);
            return out;
        }
        return fill(new u8(sz), dat[bt]);
    }
    if (ebt > dat.length)
        return;
    if (btype == 0) {
        st.b = ebt;
        if (out) {
            out.set(dat.subarray(bt, ebt), st.y);
            st.y += sz;
            return out;
        }
        return slc(dat, bt, ebt);
    }
    if (btype == 2) {
        //    byte 3        lit btype     size format
        var b3 = dat[bt], lbt = b3 & 3, sf = (b3 >> 2) & 3;
        // lit src size  lit cmp sz 4 streams
        var lss = b3 >> 4, lcs = 0, s4 = 0;
        if (lbt < 2) {
            if (sf & 1)
                lss |= (dat[++bt] << 4) | ((sf & 2) && (dat[++bt] << 12));
            else
                lss = b3 >> 3;
        }
        else {
            s4 = sf;
            if (sf < 2)
                lss |= ((dat[++bt] & 63) << 4), lcs = (dat[bt] >> 6) | (dat[++bt] << 2);
            else if (sf == 2)
                lss |= (dat[++bt] << 4) | ((dat[++bt] & 3) << 12), lcs = (dat[bt] >> 2) | (dat[++bt] << 6);
            else
                lss |= (dat[++bt] << 4) | ((dat[++bt] & 63) << 12), lcs = (dat[bt] >> 6) | (dat[++bt] << 2) | (dat[++bt] << 10);
        }
        ++bt;
        // add literals to end - can never overlap with backreferences because unused literals always appended
        var buf = out ? out.subarray(st.y, st.y + st.m) : new u8(st.m);
        // starting point for literals
        var spl = buf.length - lss;
        if (spl < 0) err(0);
        if (lbt == 0)
            buf.set(dat.subarray(bt, bt += lss), spl);
        else if (lbt == 1)
            fill(buf, dat[bt++], spl);
        else {
            // huffman table
            var hu = st.h;
            if (lbt == 2) {
                var hud = rhu(dat, bt);
                // subtract description length
                lcs += bt - (bt = hud[0]);
                st.h = hu = hud[1];
            }
            else if (!hu)
                err(0);
            (s4 ? dhu4 : dhu)(dat.subarray(bt, bt += lcs), buf.subarray(spl), hu);
        }
        // num sequences
        var ns = dat[bt++];
        if (ns) {
            if (ns == 255)
                ns = (dat[bt++] | (dat[bt++] << 8)) + 0x7F00;
            else if (ns > 127)
                ns = ((ns - 128) << 8) | dat[bt++];
            // symbol compression modes
            var scm = dat[bt++];
            if (ns * 3 > buf.length || (scm & 3))
                err(0);
            var dts = [dmlt, doct, dllt];
            for (var i = 2; i > -1; --i) {
                var md = (scm >> ((i << 1) + 2)) & 3;
                if (md == 1) {
                    // rle buf
                    var rbuf = new u8([0, 0, dat[bt++]]);
                    dts[i] = {
                        s: rbuf.subarray(2, 3),
                        n: rbuf.subarray(0, 1),
                        t: new u16(rbuf.buffer, 0, 1),
                        b: 0
                    };
                }
                else if (md == 2) {
                    // accuracy log 8 for offsets, 9 for others
                    _a = rfse(dat, bt, 9 - (i & 1)), bt = _a[0], dts[i] = _a[1];
                }
                else if (md == 3) {
                    if (!st.t)
                        err(0);
                    dts[i] = st.t[i];
                }
            }
            var _b = st.t = dts, mlt = _b[0], oct = _b[1], llt = _b[2];
            var lb = dat[ebt - 1];
            if (!lb)
                err(0);
            var spos = (ebt << 3) - 8 + msb(lb) - llt.b, cbt = spos >> 3, oubt = 0;
            var lst = ((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << llt.b) - 1);
            cbt = (spos -= oct.b) >> 3;
            var ost = ((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << oct.b) - 1);
            cbt = (spos -= mlt.b) >> 3;
            var mst = ((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << mlt.b) - 1);
            for (++ns; --ns;) {
                var llc = llt.s[lst];
                var lbtr = llt.n[lst];
                var mlc = mlt.s[mst];
                var mbtr = mlt.n[mst];
                var ofc = oct.s[ost];
                var obtr = oct.n[ost];
                if (!(llc < llb.length && mlc < mlb.length && ofc < 30)) err(0);
                cbt = (spos -= ofc) >> 3;
                var ofp = 1 << ofc;
                var off = ofp + (((dat[cbt] | (dat[cbt + 1] << 8) | (dat[cbt + 2] << 16) | (dat[cbt + 3] << 24)) >>> (spos & 7)) & (ofp - 1));
                cbt = (spos -= mlb[mlc]) >> 3;
                var ml = mlbl[mlc] + (((dat[cbt] | (dat[cbt + 1] << 8) | (dat[cbt + 2] << 16)) >> (spos & 7)) & ((1 << mlb[mlc]) - 1));
                cbt = (spos -= llb[llc]) >> 3;
                var ll = llbl[llc] + (((dat[cbt] | (dat[cbt + 1] << 8) | (dat[cbt + 2] << 16)) >> (spos & 7)) & ((1 << llb[llc]) - 1));
                cbt = (spos -= lbtr) >> 3;
                lst = llt.t[lst] + (((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << lbtr) - 1));
                cbt = (spos -= mbtr) >> 3;
                mst = mlt.t[mst] + (((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << mbtr) - 1));
                cbt = (spos -= obtr) >> 3;
                ost = oct.t[ost] + (((dat[cbt] | (dat[cbt + 1] << 8)) >> (spos & 7)) & ((1 << obtr) - 1));
                if (off > 3) {
                    st.o[2] = st.o[1];
                    st.o[1] = st.o[0];
                    st.o[0] = off -= 3;
                }
                else {
                    var idx = off - (ll != 0);
                    if (idx) {
                        off = idx == 3 ? st.o[0] - 1 : st.o[idx];
                        if (idx > 1)
                            st.o[2] = st.o[1];
                        st.o[1] = st.o[0];
                        st.o[0] = off;
                    }
                    else
                        off = st.o[0];
                }
                if (ll > buf.length - spl || ll + ml > buf.length - oubt || off <= 0 || off > st.e + oubt + ll) err(0);
                for (var i = 0; i < ll; ++i) {
                    buf[oubt + i] = buf[spl + i];
                }
                oubt += ll, spl += ll;
                var stin = oubt - off;
                if (stin < 0) {
                    var len = -stin;
                    var bs = st.e + stin;
                    if (len > ml)
                        len = ml;
                    for (var i = 0; i < len; ++i) {
                        buf[oubt + i] = st.w[bs + i];
                    }
                    oubt += len, ml -= len, stin = 0;
                }
                for (var i = 0; i < ml; ++i) {
                    buf[oubt + i] = buf[stin + i];
                }
                oubt += ml;
            }
            if (oubt > spl) err(0);
            if (oubt != spl) {
                while (spl < buf.length) {
                    buf[oubt++] = buf[spl++];
                }
            }
            else
                oubt = buf.length;
            if (out)
                st.y += oubt;
            else
                buf = slc(buf, 0, oubt);
        }
        else if (out) {
            st.y += lss;
            if (spl) {
                for (var i = 0; i < lss; ++i) {
                    buf[i] = buf[spl + i];
                }
            }
        }
        else if (spl)
            buf = slc(buf, spl);
        st.b = ebt;
        return buf;
    }
    err(2);
};
return function (frame, size) {
    var output = new Uint8Array(size);
    var state = rzfh(frame, output);
    state.e = 0;
    while (!state.l) {
        if (!rzb(frame, state, output) || state.y > size) err(0);
        state.e = state.y;
    }
    if (state.y !== size || state.b + state.c * 4 !== frame.length) err(0);
    return output;
};
}

// Stable Deadlock IDs (MurmurHash2, seed 0x44534554), from stock action and convar names.
function SettingsConfigSettingNames() {
    return {
        bindings: {
            0x6302054a: "Aim down sights",
            0xc4211b5f: "Ability 1",
            0xf05dcfd0: "Ability 2",
            0x31f0d705: "Ability 3",
            0xd16615d7: "Ability 4",
            0xca36e39b: "Melee",
            0xb56488c0: "Ability 1 casting mode",
            0x88b3b402: "Ability 2 casting mode",
            0x756a9bb7: "Ability 3 casting mode",
            0xb91b0e3c: "Ability 4 casting mode",
            0xc1e823c7: "Ability Upgrade 1",
            0xb7eb5708: "Ability Upgrade 2",
            0xb90f4338: "Ability Upgrade 3",
            0x4bfb5e1b: "Ability Upgrade 4",
            0xd97c88f1: "Ability Upgrade Radial",
            0x81df1019: "Alternate cast",
            0xa5f04676: "Alt Cast Direct",
            0xcdb116d9: "Alternate cast mode",
            0x1d9d7f8c: "Fire",
            0xdf29ada1: "Record",
            0x83c23619: "Playback",
            0x001d330a: "Stop",
            0xccdc5c5c: "Cancel ability",
            0xf6ae8df7: "Chat",
            0x5d27292c: "Chat (team)",
            0xce7b6551: "Chat Wheel",
            0x341fa38d: "Cosmetic",
            0x324df70d: "Cosmetic Menu",
            0xde918068: "Crouch / slide",
            0x8da55e52: "Toggle crouch / toggle slide",
            0x9c7b377b: "Menu",
            0x0f204955: "Avoid hero",
            0x38b9953a: "Select",
            0x7961916a: "Dev console",
            0xebe6a7ba: "Down dash",
            0xbb2222a9: "Extra info",
            0x24d50068: "Melee parry / throw held item",
            0x59544d0a: "Accept request",
            0x64e28236: "Move Hideout camera in",
            0xf72b64ee: "Move Hideout camera out",
            0x0d48d006: "Cancel matchmaking",
            0x3719e21f: "Show recent news",
            0xca40342d: "Reject request",
            0x2fb7b487: "Survey Option 1",
            0x0b71c08d: "Survey Option 2",
            0xec4fd4f7: "Survey Option 3",
            0x2ae526f8: "Survey Option 4",
            0xe0c43d13: "Survey Option 5",
            0xea3b817f: "Survey Skip",
            0x2017db46: "Hideout Toggle Edit Mode",
            0xa3eb437d: "Interact with Hideout object",
            0xa5477f14: "In-world Ping",
            0x6eb80cb0: "Interact",
            0x9407e4de: "Item 1",
            0xb8187188: "Item 2",
            0x953d3f94: "Item 3",
            0x6cd0fe4f: "Item 4",
            0x53e8176d: "Active item casting",
            0x7d225076: "Jump / mantle",
            0xb6b83631: "Back",
            0x1868972a: "Down",
            0x370984f8: "Left",
            0x7cba0c7a: "Right",
            0xdb2fbd85: "Up",
            0x4743ec50: "Minimap Zoom In",
            0x80a9115a: "Minimap Zoom Out",
            0x3291b9dc: "Chat Wheel",
            0x55ae9137: "Move Backwards",
            0x6d5795cc: "Move Down",
            0x2a7f9149: "Move Forward",
            0x4cdb8604: "Move Left",
            0x67b0b028: "Move Right",
            0x2d52424f: "Move Up",
            0x6e3a73e2: "No Clip",
            0xa562a535: "Open shop",
            0x836a5334: "Main Menu",
            0x1e292d6b: "Pause",
            0x596f7705: "In-world Ping (Long Hold) Chat Wheel",
            0x496c0890: "Ping Option 1",
            0x660a0aaf: "Ping Option 10",
            0xa166361e: "Ping Option 11",
            0x6e8994b8: "Ping Option 12",
            0xb66af026: "Ping Option 2",
            0x473f4ea6: "Ping Option 3",
            0x43e3d587: "Ping Option 4",
            0x771b5ede: "Ping Option 5",
            0x10f09270: "Ping Option 6",
            0x46d8e1c9: "Ping Option 7",
            0x9e695431: "Ping Option 8",
            0x01641ec1: "Ping Option 9",
            0xac599e7c: "Graphs",
            0xa53cb5b3: "Scoreboard",
            0x921f15fc: "Purchase quickbuy",
            0xefc156e0: "Voice chat (team)",
            0xe54d999e: "Voice chat (party)",
            0xc5542763: "Reload",
            0xdfc1785e: "Replay Chase",
            0xdd3fbbe6: "Replay death",
            0x9bfd8a2b: "Replay Decrease Speed",
            0x2a536670: "Replay Fly Down",
            0x4955e68b: "Replay Fly Up",
            0x2ac7c2a4: "Replay In Eye",
            0xa4c21ce4: "Replay Increase Speed",
            0xcf575593: "Replay Next Target",
            0x8f770739: "Replay Prev Target",
            0xf18b1b27: "Replay Toggle Pause",
            0xfee175ed: "Reroll Corrupted Items",
            0xa459940c: "Reset camera",
            0x6812086b: "Dash",
            0xc2aa455a: "Scoreboard",
            0xd5607b07: "Search items",
            0x5a98ae93: "Buy/sell search result",
            0x9f1135a5: "All Items tab",
            0x6b26467b: "Builds tab",
            0xdcbd3323: "Popular Items tab",
            0xbb0d6378: "Spirit tab",
            0x4fc67b2c: "Vitality tab",
            0xa52d2f8e: "Weapon tab",
            0xbe79684c: "Scroll down",
            0xdbe356ba: "Scroll up",
            0x31309a0c: "Spectator Chase",
            0x866ecaaf: "Spectator FOW Team Amber",
            0xc597ab50: "Spectator FOW Team Both",
            0x0906aac7: "Spectator FOW Team Sapphire",
            0xc64683d5: "Spectator FOW Team Target",
            0x429cf7af: "Fly down",
            0xb661f71f: "Fly up",
            0x1e93ccfa: "Spectator In Eye",
            0x61135576: "Spectator Next Target",
            0xe9f6c99c: "Spectator Player 1",
            0x853ad76a: "Spectator Player 10",
            0x69c895e1: "Spectator Player 11",
            0xf0dd9789: "Spectator Player 12",
            0x666387c7: "Spectator Player 2",
            0x1adf5d58: "Spectator Player 3",
            0x45989039: "Spectator Player 4",
            0x8570b5d1: "Spectator Player 5",
            0xd2deb625: "Spectator Player 6",
            0xe0980170: "Spectator Player 7",
            0xc6227d42: "Spectator Player 8",
            0xdac2dd6d: "Spectator Player 9",
            0xb781c14b: "Spectator Prev Target",
            0xeff97ae8: "Spectator Toggle Free Cursor",
            0x7eb015ba: "Stop Replay Death",
            0x40376556: "Switch Player Cam 1",
            0xf0a8312e: "Switch Player Cam 2",
            0xbaf5c3f7: "Switch Player Cam 3",
            0xb64606ce: "Switch Player Cam 4",
            0x17a1f059: "Switch Player Cam 5",
            0x380bc456: "Teleport",
            0x3aecaede: "Temp Emote",
            0x83a205a7: "Toggle free cursor",
            0xa21f23ad: "Toggle mute",
            0x83786674: "Change Replay Camera mode",
            0x3fc85a71: "Toggle Replay Team",
            0xc30fd370: "Toggle Spectator Camera",
            0xccd7a9bd: "Toggle Spectator Player Perspective",
            0x93d5a81f: "Toggle Spectator Team",
            0xd96082b6: "Zipline / rope",
        },
        settings: {
            0xa785cdca: ["Settings", "Cancel with ability key"],
            0x4c7c8d33: ["Reticle", "Reticle blue"],
            0x73200401: ["Reticle", "Reticle green"],
            0x10df609c: ["Reticle", "Reticle red"],
            0x0f21f2d5: ["Reticle", "Dot opacity"],
            0xfefe9d1d: ["Reticle", "Dot outline border"],
            0xfa09b05c: ["Reticle", "Dot outline gap"],
            0x85215959: ["Reticle", "Dot outline opacity"],
            0x9e126112: ["Reticle", "Dot size"],
            0x5d02e7ec: ["Reticle", "Outline blue"],
            0x3438285b: ["Reticle", "Outline green"],
            0x7ef4d419: ["Reticle", "Outline red"],
            0x7d34524b: ["Reticle", "Pip gap"],
            0xa05811a4: ["Reticle", "Pip gap collapse"],
            0x6f5dfc46: ["Reticle", "Fixed pip gap"],
            0xce75a234: ["Reticle", "Pip height"],
            0x4a466ee5: ["Reticle", "Pip opacity"],
            0x36c9c3f3: ["Reticle", "Pip outline border"],
            0x541538f7: ["Reticle", "Pip outline gap"],
            0xc7d760d6: ["Reticle", "Pip outline opacity"],
            0x64da8fed: ["Reticle", "Pip width"],
            0x28c6c9a2: ["Reticle", "Themed reticle"],
            0xa90b7d1c: ["Settings", "Mouse sensitivity"],
            0xf691b649: ["Settings", "Mouse sensitivity y scale"],
            0xba4f7a33: ["Settings", "Mouse zoom sensitivity ratio"],
        },
        heroes: {
            hero_akimbo: "Akimbo",
            hero_apocalypse: "Apocalypse",
            hero_architect: "Architect",
            hero_artist: "Violet",
            hero_assassin: "Assassin",
            hero_astro: "Holliday",
            hero_atlas: "Abrams",
            hero_baba: "Baba",
            hero_ballista: "Ballista",
            hero_bebop: "Bebop",
            hero_boho: "Boho",
            hero_bomber: "Bomber",
            hero_bookworm: "Paige",
            hero_cadence: "Cadence",
            hero_chessmaster: "Solomon",
            hero_chrono: "Paradox",
            hero_clawdril: "Clawdril",
            hero_coldmetal: "Cold Metal",
            hero_cowboy: "Cowboy",
            hero_deadpack: "Deadman Danny",
            hero_demoman: "Demolitions Expert",
            hero_doorman: "The Doorman",
            hero_drifter: "Drifter",
            hero_druid: "Druid",
            hero_duo: "Duo",
            hero_dynamo: "Dynamo",
            hero_familiar: "Rem",
            hero_fencer: "Apollo",
            hero_forge: "McGinnis",
            hero_fortuna: "Fortuna",
            hero_frank: "Victor",
            hero_gadgeteer: "Gadgeteer",
            hero_gadgetman: "Gadget Man",
            hero_genericperson: "Generic Person",
            hero_ghost: "Lady Geist",
            hero_gigawatt: "Seven",
            hero_glider: "Glider",
            hero_graf: "Graf",
            hero_gunner: "Gunner",
            hero_gunslinger: "Gunslinger",
            hero_haze: "Haze",
            hero_hijack: "Hijack",
            hero_hornet: "Vindicta",
            hero_inferno: "Infernus",
            hero_kali: "Kali",
            hero_kelvin: "Kelvin",
            hero_krill: "Mo & Krill",
            hero_lash: "Lash",
            hero_magician: "Sinclair",
            hero_mechaguy: "Mecha Guy",
            hero_mirage: "Mirage",
            hero_nano: "Calico",
            hero_necro: "Graves",
            hero_nurse: "Nurse Harrow",
            hero_opera: "Opera",
            hero_operative: "Raven",
            hero_orion: "Grey Talon",
            hero_phalanx: "Phalanx",
            hero_phoenix: "Phoenix",
            hero_priest: "Venator",
            hero_punkgoat: "Billy",
            hero_ratking: "Rat King",
            hero_revenant: "Revenant",
            hero_rutger: "Rutger",
            hero_sapper: "Sapper",
            hero_shieldguy: "Shield Guy",
            hero_shiv: "Shiv",
            hero_skymonk: "Sky Monk",
            hero_skyrunner: "Skyrunner",
            hero_slingshot: "Slingshot",
            hero_slork: "Fathom",
            hero_spade: "Spade",
            hero_swan: "Swan",
            hero_synth: "Pocket",
            hero_targetdummy: "TargetDummy",
            hero_tempest: "Tempest",
            hero_tengu: "Ivy",
            hero_test: "Test Hero",
            hero_thumper: "Thumper",
            hero_tokamak: "Tokamak",
            hero_trapper: "Trapper",
            hero_unicorn: "Celeste",
            hero_vampire: "Vampire",
            hero_vampirebat: "Mina",
            hero_vandal: "Vandal",
            hero_viper: "Vyper",
            hero_viscous: "Viscous",
            hero_warden: "Warden",
            hero_werewolf: "Silver",
            hero_wraith: "Wraith",
            hero_wrecker: "Wrecker",
            hero_yakuza: "The Boss",
            hero_yamato: "Yamato",
            hero_zealot: "Zealot",
        }
    };
}

// Reticle geometry is expressed in the game's 1080p reference units. Both UIs
// draw this same idle sight locally, without opening the native reticle editor.
var SettingsConfigCrosshair = (function () {
    "use strict";
    var keys = {
        0x28c6c9a2:"themed", 0x6f5dfc46:"pip_gap_static", 0xa05811a4:"pip_gap_collapse",
        0x64da8fed:"pip_width", 0xce75a234:"pip_height", 0x7d34524b:"pip_gap",
        0x4a466ee5:"pip_opacity", 0x36c9c3f3:"pip_outline_border",
        0x541538f7:"pip_outline_gap", 0xc7d760d6:"pip_outline_opacity",
        0x9e126112:"dot_size", 0x0f21f2d5:"dot_opacity", 0xfefe9d1d:"dot_outline_border",
        0xfa09b05c:"dot_outline_gap", 0x85215959:"dot_outline_opacity",
        0x10df609c:"color_r", 0x73200401:"color_g", 0x4c7c8d33:"color_b",
        0x7ef4d419:"outline_color_r", 0x3438285b:"outline_color_g", 0x5d02e7ec:"outline_color_b"
    };
    var defaults = {
        themed:false, pip_gap_static:false, pip_gap_collapse:false,
        pip_width:2, pip_height:16, pip_gap:4, pip_opacity:0.5, pip_outline_border:1,
        pip_outline_gap:0, pip_outline_opacity:0.7, dot_size:4, dot_opacity:0.7,
        dot_outline_border:2, dot_outline_gap:0, dot_outline_opacity:0.7,
        color_r:255, color_g:255, color_b:255, outline_color_r:0, outline_color_g:0, outline_color_b:0
    };
    var fieldCount = Object.keys(defaults).length;
    var size = 60;
    // One tile per stock texture, in the same order as art/reticles.webp.
    var sprites = ["center_bookworm","pip_bookworm","center_doorman","pip_doorman","center_drifter","pip_drifter",
        "center_frank_2","pip_frank","center_priest","pip_priest","center_punkgoat","pip_punkgoat","center_mokrill",
        "pip_mokrill","center_trapper","pip_trapper","center_unicorn","_unicorn_armlarge","_unicorn_armsmall",
        "center_vampirebat","pip_vampirebat","center_viper","pip_viper"];
    // Most of each source image is transparent. Fit its visible part to the cell.
    var spriteRadius = [.292,.418,.149,.055,.053,.2,.321,.069,.227,.065,.28,.17,.284,.282,.149,.485,.03,0,.19,.125,.055,.239,.36];
    // Only primary weapons with an explicit m_strCrosshairCSSClass are listed.
    // Sizes, hidden pips and center opacity come from element_gun.vcss.
    var themes = {
        hero_bookworm:{dot:0, arms:[null,1,1,null]},
        hero_doorman:{dot:2, arms:[null,3,3,null]},
        hero_drifter:{dot:4, arms:[null,5,5,null]},
        hero_frank:{dot:6, arms:[7,null,null,7]},
        hero_priest:{dot:8, arms:[9,9,9,9]},
        hero_punkgoat:{dot:10, arms:[11,11,11,11]},
        hero_skyrunner:{dot:12, arms:[null,13,13,13], dotSize:133, armWidth:32, dotOpacity:1},
        hero_trapper:{dot:14, arms:[null,15,15,null], dotSize:133, armWidth:64, armHeight:32},
        hero_unicorn:{dot:16, arms:[17,18,18,17], armWidth:96, dotOpacity:1},
        hero_vampirebat:{dot:19, arms:[20,20,20,20]},
        hero_viper:{dot:21, arms:[22,22,22,22], dotSize:133, armWidth:16}
    };
    var nextFilterId = 0;

    function fields(group) {
        var values = {};
        if (group) group.ids.forEach(function (id) {
            var key = keys[id];
            if (!key) return;
            var raw = group.entries[id][2];
            var num = raw === "true" ? 1 : Number(raw);
            if (!isFinite(num)) num = 0;
            if (typeof defaults[key] === "boolean") values[key] = num !== 0;
            else if (key.indexOf("color_") >= 0) values[key] = Math.trunc(num) & 255;
            else if (key.indexOf("opacity") >= 0) values[key] = Math.max(0, Math.min(1, num));
            else values[key] = Math.max(-2147483648, Math.min(2147483647, Math.trunc(num)));
        });
        return values;
    }

    function preview(source, hero) {
        if (!Object.keys(source).length) return null;
        return {values:Object.assign({}, defaults, source), hero:hero, partial:Object.keys(source).length < fieldCount};
    }

    function rows(before, after, heroEnabled, names) {
        var baseBefore = fields(before && before.groups["convar:"]);
        var baseTarget = fields(after.groups["convar:"]);
        var result = [];
        after.ordered.forEach(function (group) {
            if (group.kind !== "convar" || (group.hero && heroEnabled === false)) return;
            var target = group.hero ? fields(group) : baseTarget;
            if (!Object.keys(target).length) return;
            var heroBefore = group.hero && before ? fields(before.groups["convar:" + group.hero]) : {};
            var previous = Object.assign({}, baseBefore, heroBefore);
            // Target base fields become inherited values except where this hero
            // already overrides them. A partial hero target only replaces its own keys.
            var next = Object.assign({}, baseBefore, baseTarget, heroBefore, target);
            var differences = Object.keys(next).filter(function (k) { return next[k] !== previous[k]; });
            if (before && !differences.length) return;
            var current = before && preview(previous, group.hero), wanted = preview(next, group.hero);
            var scale = Math.min(1, (size / 2 - 2) / Math.max(1, extent(current), extent(wanted)));
            if (current) current.scale = scale;
            wanted.scale = scale;
            var row = {hero:group.hero ? names.heroes[group.hero] || group.hero.slice(5).replace(/_/g, " ") : "Base settings",
                category:"Reticle", setting:"Crosshair", afterPreview:wanted};
            if (before) {
                row.beforePreview = current;
                if (!differences.some(function (k) { return previous[k] !== undefined; })) row.beforeKnown = false;
            }
            result.push(row);
        });
        return result;
    }

    function rgb(v, prefix) {
        var hex = "#";
        ["r", "g", "b"].forEach(function (key) { hex += ("0" + v[prefix + key].toString(16)).slice(-2); });
        return hex;
    }

    function geometry(model) {
        var v = model.values, shapes = [];
        var fill = rgb(v, "color_"), outline = rgb(v, "outline_color_");
        function shape(x, y, width, height, color, opacity, border, round) {
            if (width > 0 && height > 0 && opacity > 0) {
                shapes.push({x:x, y:y, width:width, height:height, color:color, opacity:opacity, border:border, round:round});
            }
        }
        function edge(x, y, width, height, border, gap, opacity, round) {
            if (border > 0 && width >= 0 && height >= 0)
                shape(x, y, width + 2 * border + Math.max(0, gap), height + 2 * border + Math.max(0, gap), outline, opacity, border, round);
        }
        // The reference weapon contributes seven units of spread at rest at 1080p.
        // Collapse static reticle removes the hero-dependent part of that gap.
        var spread = v.pip_gap_static && v.pip_gap_collapse ? 0 : 7;
        var center = 4 + spread + Math.max(-14, v.pip_gap);
        var positions = [[0,-center],[center,0],[0,center],[-center,0]];
        var theme = v.themed && themes[model.hero];
        if (theme) {
            function sprite(index, x, y, width, height, angle, opacity) {
                if (index !== null && spriteRadius[index] && opacity > 0)
                    shapes.push({sprite:index,x:x,y:y,width:width,height:height,angle:angle,opacity:opacity,color:fill});
            }
            var dotSize = theme.dotSize || 128, armWidth = theme.armWidth || 128;
            sprite(theme.dot, 0, 0, dotSize, dotSize, 0, (theme.dotOpacity || 0.75) * v.dot_opacity);
            positions.forEach(function (pos, i) {
                sprite(theme.arms[i], pos[0], pos[1], armWidth, theme.armHeight || armWidth, i * 90, v.pip_opacity);
            });
            return shapes;
        }
        edge(0, 0, v.dot_size, v.dot_size, v.dot_outline_border, v.dot_outline_gap, v.dot_outline_opacity, true);
        shape(0, 0, v.dot_size, v.dot_size, fill, v.dot_opacity, 0, true);
        positions.forEach(function (pos, index) {
            var width = index % 2 ? v.pip_height : v.pip_width;
            var height = index % 2 ? v.pip_width : v.pip_height;
            shape(pos[0], pos[1], width, height, fill, v.pip_opacity, 0, false);
            edge(pos[0], pos[1], width, height, v.pip_outline_border, v.pip_outline_gap, v.pip_outline_opacity, false);
        });
        return shapes;
    }

    function extent(model) {
        if (!model) return 0;
        return geometry(model).reduce(function (radius, s) {
            if (s.sprite !== undefined) {
                var drawn = Math.max(s.width, s.height) * spriteRadius[s.sprite];
                return Math.max(radius, Math.abs(s.x) + drawn, Math.abs(s.y) + drawn);
            }
            return Math.max(radius, Math.abs(s.x) + s.width / 2, Math.abs(s.y) + s.height / 2);
        }, 0);
    }

    function caption(model, shapes) {
        if (!model) return "Not captured";
        var v = model.values;
        var parts = [];
        if (!shapes.length) parts.push("Hidden");
        if (v.themed) parts.push(themes[model.hero] ? "Hero theme" : "Hero theme · basic preview");
        if (!v.pip_gap_static) parts.push("Moving");
        else if (v.pip_gap_collapse) parts.push("Collapsed");
        else parts.push("Static");
        if (model.partial) parts.push("Partial export");
        return parts.join(" · ");
    }

    function drawWeb(cell, model) {
        var doc = cell.ownerDocument;
        var shapes = model ? geometry(model) : [];
        if (model) {
            var ns = "http://www.w3.org/2000/svg";
            var svg = doc.createElementNS(ns, "svg");
            svg.setAttribute("width", String(size));
            svg.setAttribute("height", String(size));
            svg.setAttribute("viewBox", "-30 -30 60 60");
            svg.setAttribute("role", "img");
            svg.setAttribute("aria-label", "Idle crosshair preview");
            var back = doc.createElementNS(ns, "rect");
            back.setAttribute("x", "-30"); back.setAttribute("y", "-30");
            back.setAttribute("width", "60"); back.setAttribute("height", "60");
            back.setAttribute("fill", "#59675f"); svg.appendChild(back);
            var group = doc.createElementNS(ns, "g");
            group.setAttribute("transform", "scale(" + model.scale + ")");
            if (shapes.some(function (s) { return s.sprite !== undefined; })) {
                var filter = doc.createElementNS(ns, "filter");
                var id = "reticle-tint-" + (++nextFilterId);
                filter.setAttribute("id", id);
                filter.setAttribute("color-interpolation-filters", "sRGB");
                var matrix = doc.createElementNS(ns, "feColorMatrix");
                var v = model.values;
                matrix.setAttribute("values", [v.color_r / 255,0,0,0,0, 0,v.color_g / 255,0,0,0,
                    0,0,v.color_b / 255,0,0, 0,0,0,1,0].join(" "));
                filter.appendChild(matrix);
                svg.appendChild(filter);
                group.setAttribute("filter","url(#" + id + ")");
            }
            shapes.forEach(function (s) {
                if (s.sprite !== undefined) {
                    var tile = doc.createElementNS(ns, "svg");
                    tile.setAttribute("x", String(s.x - s.width / 2));
                    tile.setAttribute("y", String(s.y - s.height / 2));
                    tile.setAttribute("width", String(s.width));
                    tile.setAttribute("height", String(s.height));
                    tile.setAttribute("viewBox", [128*(s.sprite%6),128*Math.floor(s.sprite/6),128,128].join(" "));
                    tile.setAttribute("preserveAspectRatio","none");
                    tile.setAttribute("overflow","hidden");
                    tile.setAttribute("opacity",String(s.opacity));
                    tile.setAttribute("transform","rotate(" + s.angle + " " + s.x + " " + s.y + ")");
                    var image = doc.createElementNS(ns, "image");
                    image.setAttribute("href","./art/reticles.webp");
                    image.setAttribute("width","768"); image.setAttribute("height","512");
                    tile.appendChild(image);
                    group.appendChild(tile);
                    return;
                }
                var mark = doc.createElementNS(ns, s.round ? "circle" : "rect");
                // SVG strokes straddle the path; Panorama borders sit inside the box.
                if (s.round) mark.setAttribute("r", String((s.width - s.border) / 2));
                else {
                    mark.setAttribute("x", String(s.x - (s.width - s.border) / 2));
                    mark.setAttribute("y", String(s.y - (s.height - s.border) / 2));
                    mark.setAttribute("width", String(s.width - s.border));
                    mark.setAttribute("height", String(s.height - s.border));
                }
                mark.setAttribute("fill", s.border ? "none" : s.color);
                if (s.border) { mark.setAttribute("stroke", s.color); mark.setAttribute("stroke-width", String(s.border)); }
                mark.setAttribute("opacity", String(s.opacity));
                group.appendChild(mark);
            });
            svg.appendChild(group);
            cell.appendChild(svg);
        }
        var note = doc.createElement("div");
        note.textContent = caption(model, shapes);
        cell.appendChild(note);
    }

    function drawPanorama(cell, model) {
        var wrapper = $.CreatePanel("Panel", cell, "");
        wrapper.hittest = wrapper.hittestchildren = false;
        wrapper.style.width = "100%";
        wrapper.style.flowChildren = "down";
        var shapes = model ? geometry(model) : [];
        if (model) {
            var stage = $.CreatePanel("Panel", wrapper, "");
            stage.style.width = size + "px";
            stage.style.height = size + "px";
            stage.style.backgroundColor = "#59675f";
            var scale = model.scale;
            shapes.forEach(function (s) {
                var mark = $.CreatePanel("Panel", stage, "");
                mark.style.width = (s.width * scale) + "px";
                mark.style.height = (s.height * scale) + "px";
                mark.style.position = (size / 2 + (s.x - s.width / 2) * scale) + "px " +
                    (size / 2 + (s.y - s.height / 2) * scale) + "px 0px";
                if (s.sprite !== undefined) {
                    mark.style.backgroundImage = 'url("s2r://panorama/images/hud/crosshair/reticle' + sprites[s.sprite] + '_psd.vtex")';
                    mark.style.backgroundSize = "100% 100%";
                    mark.style.transform = "rotateZ(" + s.angle + "deg)";
                    mark.style.washColor = s.color;
                } else if (s.border) mark.style.border = (s.border * scale) + "px solid " + s.color;
                else mark.style.backgroundColor = s.color;
                if (s.round) mark.style.borderRadius = "50%";
                mark.style.opacity = String(s.opacity);
            });
        }
        var note = $.CreatePanel("Label", wrapper, "");
        note.text = caption(model, shapes);
        note.style.fontSize = "13px";
        note.style.color = "#bac6bc";
        note.style.whiteSpace = "normal";
    }

    return {rows:rows, geometry:geometry, drawWeb:drawWeb, drawPanorama:drawPanorama};
}());

// In-memory reader for Deadlock's v1 TLV settings export.
var SettingsConfigAnalysis = (function () {
    "use strict";
    var maxCode = 524288, maxPayload = 1048576, maxRecords = 40000, maxRows = 300;
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._";
    // Per-hero settings use these IDs for the three base mouse controls as well.
    var mouseIds = {sensitivity:0xa90b7d1c, sensitivity_y_scale:0xf691b649, zoom_sensitivity_ratio:0xba4f7a33};
    function mouseId(id) {
        return id === mouseIds.sensitivity || id === mouseIds.sensitivity_y_scale || id === mouseIds.zoom_sensitivity_ratio;
    }

    function invalid() { throw new Error("This DL. settings code is damaged or incomplete."); }
    function limit() { throw new Error("This code exceeds the local comparison limits."); }

    function readBase64(code) {
        if (typeof code !== "string" || code.length > maxCode) limit();
        var match = /^DL\.([A-Za-z0-9._]+)(={0,2})$/.exec(code);
        if (!match) invalid();
        var data = match[1], pad = match[2].length, tail = data.length % 4;
        if (tail === 1 || (pad && (pad + tail !== 4))) invalid();
        var out = new Uint8Array(Math.floor(data.length * 3 / 4)), off = 0, bits = 0, n = 0;
        for (var i = 0; i < data.length; i++) {
            bits = (bits << 6) | alphabet.indexOf(data[i]);
            n += 6;
            if (n >= 8) { n -= 8; out[off++] = bits >>> n; }
        }
        if ((bits & ((1 << n) - 1)) || out.length < 7) invalid();
        return out;
    }

    function little(data, at, len) {
        if (at + len > data.length) invalid();
        var value = 0;
        for (var i = len - 1; i >= 0; i--) value = value * 256 + data[at + i];
        return value;
    }

    function decompress(frame, getDecoder) {
        if (little(frame, 0, 4) !== 0xfd2fb528 || frame.length < 8) invalid();
        var flags = frame[4], single = !!(flags & 32), at = 5;
        // Deadlock writes one frame, a known content length, and no dictionary.
        if (flags & 27) throw new Error("This Zstandard settings frame is unsupported.");
        if (!single) {
            var window = frame[at++], base = Math.pow(2, 10 + (window >>> 3));
            if (base * (1 + (window % 8) / 8) > maxPayload) limit();
        }
        var bytes = [single ? 1 : 0, 2, 4, 8][flags >>> 6];
        if (!bytes) throw new Error("The settings frame has no decoded size.");
        var size = little(frame, at, bytes) + (bytes === 2 ? 256 : 0);
        if (!size) invalid();
        if (size > maxPayload) limit();
        at += bytes;
        for (var blocks = 0; ; blocks++) {
            if (blocks >= 128) limit();
            var header = little(frame, at, 3), type = (header >>> 1) & 3, length = header >>> 3;
            if (type === 3 || length > 131072) invalid();
            at += 3 + (type === 1 ? 1 : length);
            if (at > frame.length) invalid();
            if (header & 1) break;
        }
        if (at + ((flags & 4) ? 4 : 0) !== frame.length) invalid();
        try { return getDecoder()(frame, size); }
        catch (err) { invalid(); }
    }

    function crc32(data) {
        var crc = -1;
        for (var i = 0; i < data.length; i++) {
            crc ^= data[i];
            for (var bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
        return (~crc) >>> 0;
    }

    function variable(reader) {
        var value = 0;
        for (var i = 0; i < 5; i++) {
            if (reader.at >= reader.end) invalid();
            var byte = reader.data[reader.at++];
            if (i === 4 && byte >= 16) invalid();
            value += (byte & 127) * Math.pow(128, i);
            if (byte < 128) return value;
        }
        invalid();
    }

    function number(field) {
        var result = variable(field);
        if (field.at !== field.end) invalid();
        return result;
    }

    function string(field) {
        // IDs, binding names, and convar values in this format are printable ASCII.
        if (field.end - field.at > 192) limit();
        var result = "";
        for (var i = field.at; i < field.end; i++) {
            var byte = field.data[i];
            if (byte < 32 || byte > 126) throw new Error("This settings field uses an unsupported text encoding.");
            result += String.fromCharCode(byte);
        }
        return result;
    }

    function each(field, doc, visitor) {
        while (field.at < field.end) {
            if (++doc.recordCount > maxRecords) limit();
            var start = field.at;
            var tag = variable(field), length = variable(field), end = field.at + length;
            if (!tag || end > field.end) invalid();
            visitor(tag, {data: field.data, at: field.at, end: end}, start);
            field.at = end;
        }
    }

    function parseGroup(field, kind, isHero, doc) {
        var hero = "", entries = Object.create(null), ordered = [];
        each(field, doc, function (tag, item) {
            if (tag === 1 && isHero) {
                if (hero) invalid();
                hero = string(item);
                if (!/^hero_[A-Za-z0-9_]+$/.test(hero)) invalid();
                return;
            }
            if (tag !== 2) { doc.unknownCount++; return; }
            var id, parts = Object.create(null);
            each(item, doc, function (key, value) {
                if (key === 1) {
                    if (id !== undefined) invalid();
                    id = number(value);
                } else if (key === 2 || (kind === "bind" && key <= 6)) {
                    if (parts[key] !== undefined) invalid();
                    parts[key] = key === 6 ? number(value) : string(value);
                } else doc.unknownCount++;
            });
            if (id === undefined || entries[id] || (kind === "convar" && parts[2] === undefined)) invalid();
            entries[id] = parts;
            ordered.push(id);
        });
        if (isHero !== !!hero) invalid();
        var key = kind + ":" + hero;
        if (doc.groups[key]) invalid();
        var group = {hero: hero, kind: kind, entries: entries, ids: ordered};
        doc.groups[key] = group;
        doc.ordered.push(group);
    }

    function contents(code, getDecoder) {
        var envelope = readBase64(code);
        if (envelope[0] !== 1 || envelope[1] > 1) throw new Error("This DL. settings format is unsupported.");
        var body = envelope.subarray(6);
        if (envelope[1]) body = decompress(body, getDecoder);
        if (crc32(body) !== little(envelope, 2, 4)) throw new Error("The settings code failed its checksum.");
        return body;
    }

    function completeExport(code) {
        try {
            contents(code, SettingsConfigCreateZstd);
            return true;
        } catch (_) { return false; }
    }

    function packPlain(parts) {
        var size = parts.reduce(function (sum, part) { return sum + part.length; }, 0);
        var data = new Uint8Array(6 + size), at = 6;
        if (3 + Math.ceil(data.length * 4 / 3) > maxCode) {
            throw new Error("The selected settings are too large for a Deadlock import code.");
        }
        // The v1 envelope's zero compression flag carries the TLV body directly.
        data[0] = 1;
        parts.forEach(function (part) { data.set(part, at); at += part.length; });
        var crc = crc32(data.subarray(6));
        for (var i = 0; i < 4; i++) data[2 + i] = crc >>> (8 * i);
        var result = "DL.";
        for (var p = 0; p < data.length; p += 3) {
            var n = (data[p] << 16) | (data[p + 1] << 8) | data[p + 2];
            result += alphabet[n >>> 18] + alphabet[(n >>> 12) & 63];
            if (p + 1 < data.length) result += alphabet[(n >>> 6) & 63];
            if (p + 2 < data.length) result += alphabet[n & 63];
        }
        return result;
    }

    function importOptions(choice, mouseDefault) {
        var object = choice && typeof choice === "object" ? choice : {};
        return {
            mouseSensitivity: choice === undefined ? mouseDefault : (choice === true || object.mouseSensitivity === true),
            crosshair: object.crosshair !== false,
            keybinds: object.keybinds !== false
        };
    }

    function requiresHeroSettings(fields, choice) {
        var options = importOptions(choice, false);
        return fields.heroOther || (fields.heroCrosshair && options.crosshair) ||
            (fields.heroKeybinds && options.keybinds) || (fields.heroMouseSensitivity && options.mouseSensitivity);
    }

    // Walk raw TLVs so rewriting lengths never drops fields from a newer game build.
    // The name and revision of the keybinding profile belong with the binding groups.
    function scopedPayload(code, options, extra, inspectOnly) {
        var body = contents(code, SettingsConfigCreateZstd), doc = {recordCount:0};
        var names = SettingsConfigSettingNames().settings;
        var fields = {mouseSensitivity:false, crosshair:false, keybinds:false, other:false,
            heroMouseSensitivity:false, heroCrosshair:false, heroKeybinds:false, heroOther:false};
        var parts = [], changed = false, hasContent = false;
        function found(category, hero) {
            fields[category] = true;
            if (hero) fields["hero" + category[0].toUpperCase() + category.slice(1)] = true;
        }
        if (extra) Object.keys(extra.values).forEach(function (key) {
            found(Object.prototype.hasOwnProperty.call(mouseIds, key) ? "mouseSensitivity" : "other", false);
        });
        each({data:body, at:0, end:body.length}, doc, function (tag, group, start) {
            if (tag === 7 || tag === 8) {
                found("keybinds", tag === 8);
                if (!options.keybinds) { changed = true; return; }
                hasContent = true;
                if (!inspectOnly) parts.push(body.subarray(start, group.end));
                return;
            }
            if (tag !== 2 && tag !== 3) {
                if ((tag === 4 || tag === 5) && !options.keybinds) { changed = true; return; }
                if (tag !== 1 && tag !== 4 && tag !== 5) { hasContent = true; fields.other = true; }
                if (!inspectOnly) parts.push(body.subarray(start, group.end));
                return;
            }
            var removed = false, hasEntries = false, kept = [], size = 0;
            each(group, doc, function (key, item, itemStart) {
                if (key === 2) {
                    var id;
                    each(item, doc, function (key, value) {
                        if (key !== 1) return;
                        if (id !== undefined) invalid();
                        id = number(value);
                    });
                    if (id === undefined) invalid();
                    var category = mouseId(id) ? "mouseSensitivity" :
                        (names[id] && names[id][0] === "Reticle" ? "crosshair" : "other");
                    found(category, tag === 3);
                    if (options[category] === false) { changed = removed = true; return; }
                } else if (key !== 1 || tag !== 3) {
                    found("other", tag === 3);
                }
                if (key !== 1 || tag !== 3) hasEntries = true;
                if (!inspectOnly) kept.push(body.subarray(itemStart, item.end));
                size += item.end - itemStart;
            });
            if (hasEntries) hasContent = true;
            if (inspectOnly) return;
            if (!removed) parts.push(body.subarray(start, group.end));
            else if (hasEntries) {
                var header = [tag];
                while (size >= 128) { header.push((size & 127) | 128); size >>>= 7; }
                header.push(size);
                parts.push(header);
                kept.forEach(function (part) { parts.push(part); });
            }
        });
        if (inspectOnly) return fields;
        return {code:!hasContent ? null : changed ? packPlain(parts) : code, fields:fields};
    }

    function hasMouseSensitivity(code, extra) {
        if (extra && extra.values && Object.keys(mouseIds).some(function (key) {
            return Object.prototype.hasOwnProperty.call(extra.values, key);
        })) return true;
        try { return scopedPayload(code, importOptions(undefined, true), undefined, true).mouseSensitivity; }
        catch (_) { return false; }
    }

    function decode(code, getDecoder) {
        var body = contents(code, getDecoder);
        var doc = {groups: Object.create(null), ordered: [], recordCount: 0, unknownCount: 0};
        each({data: body, at: 0, end: body.length}, doc, function (tag, field) {
            if (tag === 2 || tag === 3) parseGroup(field, "convar", tag === 3, doc);
            else if (tag === 7 || tag === 8) parseGroup(field, "bind", tag === 8, doc);
            else if (tag === 1 || tag === 4) number(field); // build and keybinding schema revision
            else if (tag !== 5) doc.unknownCount++; // tag 5 is the source keybind profile name
        });
        if (!doc.ordered.length && !doc.unknownCount) throw new Error("This code contains no comparable settings.");
        return doc;
    }

    function keyName(name) {
        var key = (name || "").toUpperCase();
        if (key === "NONE") return "";
        if (/^MOUSE\d+$/.test(key)) return "Mouse " + key.slice(5);
        var names = {MWHEELUP: "Wheel up", MWHEELDOWN: "Wheel down", SHIFT: "Shift", CTRL: "Ctrl", ALT: "Alt", SPACE: "Space", ENTER: "Enter", TAB: "Tab", ESCAPE: "Esc"};
        return names[key] || key;
    }

    function chord(key, modifier) {
        var button = keyName(key), mod = keyName(modifier);
        return button && mod ? mod + " + " + button : button;
    }

    function settingValue(raw) {
        if (raw === "true") return "On";
        if (raw === "false") return "Off";
        if (/^-?\d+(?:\.\d+)?$/.test(raw) && raw.length < 16) return String(Number(raw));
        return raw;
    }

    function value(parts, kind, id) {
        if (!parts) return "Not in current export";
        if (kind === "convar") return settingValue(parts[2]);
        // Mode numbers are binding values in the share format. 0 and 3 match
        // the game's Default and Quick Cast selections, respectively.
        if (id === 3450935001) {
            if (/^[012]$/.test(parts[2])) return ["Press and hold", "Double tap", "Alternate cast button"][Number(parts[2])];
            return "Mode " + (parts[2] || "unset");
        }
        if ([1407719277, 3043264704, 2293478402, 1969920951, 3105558076].indexOf(id) >= 0) {
            if (parts[2] === "0") return id === 1407719277 ? "Item default" : "Ability default";
            if (parts[2] === "3") return "Quick Cast";
            return "Mode " + (parts[2] || "unset");
        }
        var buttons = [chord(parts[2], parts[3]), chord(parts[4], parts[5])].filter(Boolean).join(" / ");
        if (parts[6] !== undefined) return (buttons ? buttons + " · " : "") + "Ping option " + parts[6];
        return buttons || "Unbound";
    }

    // Preserve primary/secondary and the original token when friendly labels collide.
    function detail(parts, kind) {
        if (!parts) return "Not in current export";
        if (kind === "convar") {
            var raw = parts[2];
            return /^-?\d+(?:\.\d+)?$/.test(raw) && raw.length < 16 ? String(Number(raw)) : JSON.stringify(raw);
        }
        var buttons = [2, 3, 4, 5].map(function (key) {
            var token = String(parts[key] || "").toUpperCase();
            return token === "NONE" ? "" : token;
        });
        var first = [buttons[1], buttons[0]].filter(Boolean).join(" + ") || "unbound";
        var second = [buttons[3], buttons[2]].filter(Boolean).join(" + ") || "unbound";
        return "Primary " + first + " · Secondary " + second + (parts[6] === undefined ? "" : " · Ping " + parts[6]);
    }

    function analyze(beforeCode, afterCode, heroEnabled, currentExtra, targetExtra, includeMouseSensitivity, fullReport) {
        var decoder;
        function getDecoder() {
            if (!decoder) decoder = SettingsConfigCreateZstd();
            return decoder;
        }
        var options = importOptions(includeMouseSensitivity, true);
        var describeOnly = beforeCode === null;
        var before = describeOnly ? {groups:{}, unknownCount:0} : decode(beforeCode, getDecoder);
        var after = beforeCode === afterCode ? before : decode(afterCode, getDecoder);
        var names = SettingsConfigSettingNames();
        var result = {changes: [], total: 0, truncated: false, unknownCount: after.unknownCount + (after === before ? 0 : before.unknownCount)};
        var extra = SettingsConfigExtra.validate(targetExtra);
        var replacedBase = {};
        if (extra) {
            var current = SettingsConfigExtra.validate(currentExtra);
            Object.keys(extra.values).forEach(function (key) {
                var field = SettingsConfigExtra.fields[key], wanted = extra.values[key];
                var actual = current && current.values[key];
                var nativeId = mouseIds[key];
                if (nativeId && !options.mouseSensitivity) return;
                if (nativeId) {
                    replacedBase[nativeId] = true;
                    var baseValues = before.groups["convar:"];
                    var prior = baseValues && baseValues.entries[nativeId];
                    if (actual === undefined && prior && /^-?\d+(?:\.\d+)?$/.test(prior[2]))
                        actual = Number(prior[2]);
                }
                if (actual === wanted || (typeof actual === "number" && !field.integer && Math.abs(actual - wanted) < 0.000001)) return;
                function format(value) {
                    if (value === undefined) return "Not captured";
                    if (field.integer && field.min === 0 && field.max === 1) return value ? "On" : "Off";
                    return String(value);
                }
                var row = {hero:"Base settings", category:field.category, setting:field.label, after:format(wanted)};
                if (!describeOnly) row.before = format(actual);
                if (!describeOnly && actual === undefined) row.beforeKnown = false;
                result.changes.push(row);
                result.total++;
            });
        }
        after.ordered.forEach(function (group) {
            if (group.hero && heroEnabled === false) return;
            if (group.kind === "bind" && !options.keybinds) return;
            var previous = before.groups[group.kind + ":" + group.hero], base = before.groups[group.kind + ":"];
            var hero = group.hero ? names.heroes[group.hero] || group.hero.slice(5).replace(/_/g, " ") : "Base settings";
            group.ids.forEach(function (id) {
                if (group.kind === "convar" && !options.mouseSensitivity && mouseId(id)) return;
                if (group.kind === "convar" && names.settings[id] && names.settings[id][0] === "Reticle") return;
                if (!group.hero && group.kind === "convar" && replacedBase[id]) return;
                var inherited = previous && previous.entries[id];
                if (!inherited && group.hero && base) inherited = base.entries[id];
                var was = value(inherited, group.kind, id), next = value(group.entries[id], group.kind, id);
                var setting = group.kind === "convar" ? names.settings[id] : names.bindings[id];
                if (!setting) result.unknownCount++;
                if (!describeOnly && was === next) {
                    was = detail(inherited, group.kind);
                    next = detail(group.entries[id], group.kind);
                    if (was === next) return;
                }
                result.total++;
                if (!describeOnly && fullReport !== true && result.changes.length >= maxRows) { result.truncated = true; return; }
                var category = group.kind === "bind" ? "Keybinds" : setting ? setting[0] : "Settings";
                var label = setting ? (group.kind === "bind" ? setting : setting[1]) : "Unknown ID 0x" + id.toString(16);
                var row = {hero: hero, category: category, setting: label, after: next};
                if (!describeOnly) row.before = was;
                if (!describeOnly && !inherited) row.beforeKnown = false;
                result.changes.push(row);
            });
        });
        if (options.crosshair) {
            var crosshairs = SettingsConfigCrosshair.rows(describeOnly ? null : before, after, heroEnabled, names);
            result.total += crosshairs.length;
            crosshairs.forEach(function (row) {
                if (!describeOnly && !row.beforePreview) row.beforeKnown = false;
                if (describeOnly || fullReport === true || result.changes.length < maxRows) result.changes.push(row);
                else result.truncated = true;
            });
        }
        return result;
    }

    return {compare: analyze, completeExport: completeExport, hasMouseSensitivity: hasMouseSensitivity,
        describe: function (code, heroSpecific, extraSettings) { return analyze(null, code, true, undefined, extraSettings); },
        importable: function (code, extra) { return scopedPayload(code, importOptions(undefined, true), extra, true); },
        prepareImport: function (code, choice) { return scopedPayload(code, importOptions(choice, false), undefined, false); },
        requiresHeroSettings:requiresHeroSettings,
        withoutMouseCode: function (code) { return scopedPayload(code, importOptions(false, false), undefined, false).code; },
        isMouseSetting: function (key) { return Object.prototype.hasOwnProperty.call(mouseIds, key); }};
}());

export const {compare, describe, importable, requiresHeroSettings} = SettingsConfigAnalysis;
export const drawCrosshair = SettingsConfigCrosshair.drawWeb;