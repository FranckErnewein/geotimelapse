use actix_web::web::{Json, Path};
use actix_web::HttpResponse;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::constants::APPLICATION_JSON;
use crate::response::Response;

pub type Datasets = Response<Dataset>;

#[derive(Debug, Deserialize, Serialize)]
pub struct Dataset {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub title: String,
}

impl Dataset {
    pub fn new(title: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            created_at: Utc::now(),
            title,
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DatasetRequest {
    pub title: Option<String>,
}

impl DatasetRequest {
    pub fn to_dataset(&self) -> Option<Dataset> {
        match &self.title {
            Some(title) => Some(Dataset::new(title.to_string())),
            None => None,
        }
    }
}

/// list 50 last datasets `/datasets`
#[get("/datasets")]
pub async fn list() -> HttpResponse {
    // TODO find the last 50 datasets and return them

    let datasets: Response<Dataset> = Datasets { results: vec![] };

    HttpResponse::Ok()
        .content_type(APPLICATION_JSON)
        .json(datasets)
}

/// create a dataset `/datasets`
#[post("/datasets")]
pub async fn create(dataset_req: Json<DatasetRequest>) -> HttpResponse {
    HttpResponse::Created()
        .content_type(APPLICATION_JSON)
        .json(dataset_req.to_dataset())
}

/// find a dataset by its id `/datasets/{id}`
#[get("/datasets/{id}")]
pub async fn get(path: Path<(String,)>) -> HttpResponse {
    // TODO find dataset a dataset by ID and return it
    let found_dataset: Option<Dataset> = None;

    match found_dataset {
        Some(dataset) => HttpResponse::Ok()
            .content_type(APPLICATION_JSON)
            .json(dataset),
        None => HttpResponse::NoContent()
            .content_type(APPLICATION_JSON)
            .await
            .unwrap(),
    }
}

/// delete a dataset by its id `/datasets/{id}`
#[delete("/datasets/{id}")]
pub async fn delete(path: Path<(String,)>) -> HttpResponse {
    // TODO delete dataset by ID
    // in any case return status 204

    HttpResponse::NoContent()
        .content_type(APPLICATION_JSON)
        .await
        .unwrap()
}
