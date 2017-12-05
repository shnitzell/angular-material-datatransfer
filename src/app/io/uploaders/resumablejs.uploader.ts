import { Injectable } from '@angular/core';
import * as _ from 'underscore';
import * as Resumable from 'resumablejs';

import { BaseUploader } from './base.uploader';
import { LoggerService, CryptoService } from '../../services';
import { IAppConfig, IDatatransferItem, DatatransferItem, SizeInformation, ProgressInformation } from '../../models';
import { TransferType, TransferStatus, DecimalByteUnit, HashType } from '../../enums';
import { GuidUtil } from '../../utils';

@Injectable()
export class ResumableJsUploader extends BaseUploader {

    private r: Resumable = undefined;
    private preprocessFileFn = undefined;
    private preprocessChunkFn = undefined;

    constructor(protected logger: LoggerService, protected config: IAppConfig,
        protected guidUtil: GuidUtil, private cryptoService: CryptoService) {
        super(logger, config, guidUtil);
        this.initResumable();
    }

    private initResumable(): void {

        function generateId(file, event) {
            let that = this as ResumableJsUploader;
            return that.generateUniqueIdentifier();
        }

        function preprocessChunkFn(resumableChunk) {
            let that = this as ResumableJsUploader;
            if (typeof that.preprocessChunkFn === 'function') {
                that.preprocessChunkFn(resumableChunk);
            } else {
                resumableChunk.preprocessFinished();
            }
        }

        function preprocessFileFn(resumableFile) {
            let that = this as ResumableJsUploader;
            if (typeof that.preprocessFileFn === 'function') {
                // that.cryptoService.createHash(resumableFile.file, HashType.SHA1);
                that.preprocessFileFn(resumableFile);
            } else {
                resumableFile.preprocessFinished();
            }
        }

        this.config.resumablejs.generateUniqueIdentifier = generateId.bind(this);

        if (typeof this.config.resumablejs.preprocess === 'function') {
            // clones the function with '{}' acting as it's new 'this' parameter
            this.preprocessChunkFn = this.config.resumablejs.preprocess.bind({});
        }
        this.config.resumablejs.preprocess = preprocessChunkFn.bind(this);

        if (typeof this.config.resumablejs.preprocessFile === 'function') {
            // clones the function with '{}' acting as it's new 'this' parameter
            this.preprocessFileFn = this.config.resumablejs.preprocessFile.bind({});
        }
        this.config.resumablejs.preprocessFile = preprocessFileFn.bind(this);

        this.r = new Resumable(this.config.resumablejs);

        this.r.on('fileAdded', function (file, event) {
            let that = this as ResumableJsUploader;
            let newItem = new DatatransferItem({
                id: file.uniqueIdentifier,
                name: file.fileName,
                path: file.relativePath.substr(0, file.relativePath.length - file.fileName.length),
                sizeInformation: new SizeInformation({ decimalByteUnit: DecimalByteUnit.Byte, decimalByteUnitSize: file.size }),
                progressInformation: new ProgressInformation(file.size),
                transferType: TransferType.Upload,
                status: TransferStatus.Ready,
                externalItem: file
            });
            file.internalItem = newItem;

            that.addItem(newItem);
        }.bind(this));
        this.r.on('fileProgress', function (file, message) {
            let that = this as ResumableJsUploader;
            // that.logger.log('fileProgress', file.progress());
            that.changeItemStatus(file.internalItem, TransferStatus.Uploading);
            that.updateItemProgress(file.internalItem, file.progress());
            that.updateOverallProgress(that.transferType, that.r.progress());
        }.bind(this));
        this.r.on('fileSuccess', function (file, message) {
            let that = this as ResumableJsUploader;
            // that.logger.log('fileSuccess', file);
            that.changeItemStatus(file.internalItem, TransferStatus.Finished, message);
        }.bind(this));
        this.r.on('fileError', function (file, message) {
            let that = this as ResumableJsUploader;
            // that.logger.log('fileError', file, message);
            that.changeItemStatus(file.internalItem, TransferStatus.Failed, message);
        }.bind(this));
        this.r.on('uploadStart', function () {
            let that = this as ResumableJsUploader;
            that.updateOverallProgress(that.transferType, that.r.progress());
            that.updateOverallSize(that.r.getSize());
        }.bind(this));
        this.r.on('chunkingComplete', function () {
            let that = this as ResumableJsUploader;
            // that.logger.log('chunkingComplete');
        }.bind(this));
        this.r.on('complete', function () {
            let that = this as ResumableJsUploader;
            // that.logger.log('complete');
        }.bind(this));
    }

    protected addFiles(files, event): void {
        this.r.addFiles(files, event);
    }

    public assignBrowse(element, isDirectory): void {
        this.r.assignBrowse(element, isDirectory);
    }

    public assignDrop(element): void {
        this.r.assignDrop(element);
    }

    public editPath(oldPath: string, newPath: string): void {
        super.editPath(oldPath, newPath);
        _.each(this.r.files, function (file) {
            let internalItem = file.internalItem as IDatatransferItem;
            if (internalItem.status === TransferStatus.Ready && internalItem.path === oldPath) {
                file.relativePath = newPath + file.fileName;
                internalItem.path = newPath;
            }
        }.bind(this));
    }

    public editFilename(item: IDatatransferItem, name: string): void {
        super.editFilename(item, name);
        item.externalItem.fileName = name;
        item.externalItem.relativePath = item.path + name;
        item.name = name;
    }

    public isWorking(): boolean {
        return this.r.isUploading();
    }

    public startAll(): void {
        this.r.upload();
    }

    public pauseAll(): void {
        this.r.pause();
    }

    public removeAll(): void {
        let tempFiles = this.r.files.slice();
        _.each(tempFiles, function (file) {
            let that = this as ResumableJsUploader;
            that.r.removeFile(file);
        }.bind(this));
    }

    public removeItem(item: IDatatransferItem): void {
        this.r.removeFile(item.externalItem);
    }

    public retryItem(item: IDatatransferItem): void {
        item.externalItem.retry();
    }
}
