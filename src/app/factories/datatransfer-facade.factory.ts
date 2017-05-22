import { Injectable, NgZone } from '@angular/core';
import { LoggerService } from '../services';
import { DatatransferFacade } from '../facades';
import { DatatransferItemStore } from '../stores';
import { ResumableJsUploader } from '../uploaders';
import { DecimalByteUnitUtil } from '../utils';

@Injectable()
export class DatatransferFacadeFactory {

    constructor(private logger: LoggerService, private zone: NgZone,
        private store: DatatransferItemStore, private decimalByteUnitUtil: DecimalByteUnitUtil) {

    }

    // TODO: pass arguments to define which uploader/downloader implementation should be used
    public createDatatransferFacade(): DatatransferFacade {
        return new DatatransferFacade(this.logger, this.zone, this.store, new ResumableJsUploader(this.logger, this.decimalByteUnitUtil));
    }
}