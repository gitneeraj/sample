import { Component, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';

import { AppService } from '../../_services/app.services';

import { AppComponent } from '../../app.component';

import * as moment from 'moment';
declare var $: any;

/* Begin: Include models */
import { JobSchedule } from '../../_models/job_schedule';
import { Source } from '../../_models/scrape_source';
import { Company } from '../../_models/company';
/* End: Include models */

@Component({
	selector: '.jobs-content',
	templateUrl: './jobSource.component.html'
})


export class JobSourceComponent implements OnInit{
	
	public daterange: any = null;
	public _source = new Source(1, '', '', '', '', 'XML', '', 'weekly', '', 1, '');
    public _listData: Source[] = [];
	public _submitting: boolean = false;
	public _isLoading: boolean = true;
	public _companies: Company[] = [];
    public _companyId: number = 0;
    public _authenticated: any = {};
    public _editId: number = 0;

	public dateRangePickerOptions: any = {
        locale: { format: 'DD-MM-YYYY' },
        alwaysShowCalendars: true,
	};
	
	constructor(public _appServices: AppService,
				public _route: ActivatedRoute,
                public _router: Router,
                public _app: AppComponent) {
                    this._authenticated = this._app.authenticated;
    }
	
	private selectedDate(value: any) {
		this.daterange = {
            startDate: moment(value.start).format('YYYY-MM-DD HH:mm:ss'),
            endDate: moment(value.end).format('YYYY-MM-DD HH:mm:ss')
        }
        this.getJobSources(this._companyId, this.daterange);
	}
	
    ngOnInit() {
		if(this._route.snapshot.paramMap.get('company'))
			this._companyId = parseInt(this._route.snapshot.paramMap.get('company'));
		this.getJobSources((this._companyId)? this._companyId : 0);
		this.getCompanies();
	}

	private getJobSources(company_id?: number, search?: any){
		this._appServices.getJobSources(company_id, search)
		.subscribe(
			jobDetails => {
				this._isLoading = false;
				this._listData = jobDetails;
			},
			error => {}
		);
	}

	private getCompanies(){
		this._appServices.getCompanies()
		.subscribe(
			companies => {
				this._companies = companies;
			},
			error => {}
		);
    }
    
    private getJobSource(id: number){
		this._editId = id;
		this._appServices.getJobSource(id)
			.subscribe(
				jobDetail => {
					if(jobDetail.status == 'fail'){
						$.notify({
							icon: "fa fa-times-circle",
							message: jobDetail.message
						},{
							type: 'danger',
							timer: 1000,
						});
					}else{
						$("#newScrapeRequestModal .form-group").removeClass('is-empty');
						this._source = jobDetail;
					}
				},
				error => {
					$.notify({
						icon: "fa fa-times-circle",
						message: "Something went wrong!"
					},{
						type: 'danger',
						timer: 1000,
					});
				}
			);
    }
    
    private onSubmit(){
        delete this._source.id;
		this._submitting = true;
		if(this._editId != 0){ // update
			this._appServices.updateJobSource(this._source, this._editId)
				.subscribe(
					response => {
						this._submitting = false;
						if(response.status == 'fail'){
							$.notify({
								icon: "fa fa-times-circle",
								message: response.message
							},{
								type: 'danger',
								timer: 1000,
							});
						}else if(response.status == 'success'){
							this.getJobSources();

							$.notify({
								icon: "fa fa-check-circle",
								message: response.message
							},{
								type: 'success',
								timer: 1000,
							});
							$("#newScrapeRequestModal").modal('hide');
							this.reset();
						}
					},
					error => {}
				);
		}else{ // Add
			this._appServices.addJobSource(this._source)
				.subscribe(
					response => {
						this._submitting = false;
	
						if(response.status == 'fail'){
							$.notify({
								icon: "fa fa-times-circle",
								message: response.message
							},{
								type: 'danger',
								timer: 1000,
							});
						}else if(response.status == 'success'){
							this.getJobSources();
	
							$.notify({
								icon: "fa fa-check-circle",
								message: response.message
							},{
								type: 'success',
								timer: 1000,
							});
	
							$("#newScrapeRequestModal").modal('hide');
							this.reset();
						}
											
					},
					error => {
						$.notify({
							icon: "fa fa-times-circle",
							message: "Something went wrong!"
						},{
							type: 'danger',
							timer: 1000,
						});
					}
				);
		}
    }
    
    reset(){
		this._source = new Source(1, '', '', '', '', 'XML', '', 'weekly', '', 1, '');
		$("#newScrapeRequestModal .form-group").addClass('is-empty');
		this._editId = 0;
	}

	resetFilters(){
		this.daterange = null;
		this.dateRangePickerOptions = {
			startDate: moment(),
			endDate: moment()
		}
		this.getJobSources(this._companyId, this.daterange);
	}
}