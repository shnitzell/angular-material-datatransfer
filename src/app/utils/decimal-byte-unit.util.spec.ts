import { inject, TestBed } from '@angular/core/testing';

import { DecimalByteUnit, DecimalByteUnitConvertResult, DecimalByteUnitUtil } from './decimal-byte-unit.util';

describe('DecimalByteUnit Util', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [DecimalByteUnitUtil] });
    });

    it('should convert Byte to Byte', inject([DecimalByteUnitUtil], (util) => {
        expect(util.convert(1, DecimalByteUnit.BYTE, DecimalByteUnit.BYTE)).toBe(1);
    }));

    it('should convert Byte to KB', inject([DecimalByteUnitUtil], (util) => {
        expect(util.convert(1000, DecimalByteUnit.BYTE, DecimalByteUnit.KB)).toBe(1);
    }));

    it('should convert KB to Byte', inject([DecimalByteUnitUtil], (util) => {
        expect(util.convert(1, DecimalByteUnit.KB, DecimalByteUnit.BYTE)).toBe(1000);
    }));

    it('should convert Byte to human readable', inject([DecimalByteUnitUtil], (util) => {
        let result: DecimalByteUnitConvertResult = util.toHumanReadable(10146666, DecimalByteUnit.BYTE);
        expect(result.number).toBe(10.15);
        expect(result.unit).toBe(DecimalByteUnit.MB);
    }));
});
