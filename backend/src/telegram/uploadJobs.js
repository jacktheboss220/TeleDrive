// ponytail: in-memory job map, single process only, jobs vanish on restart.
// Fine for a single-user app with one Node process; a real queue (Bull/Redis)
// would be the upgrade if this ever runs multiple instances.
const jobs = new Map();

function createJob(id) {
  jobs.set(id, { progress: 0, phase: 'uploading', result: null, error: null });
}

function updateProgress(id, progress) {
  const job = jobs.get(id);
  if (job) job.progress = progress;
}

function completeJob(id, result) {
  const job = jobs.get(id);
  if (job) {
    job.phase = 'done';
    job.progress = 1;
    job.result = result;
  }
}

function failJob(id, error) {
  const job = jobs.get(id);
  if (job) {
    job.phase = 'error';
    job.error = error;
  }
}

function getJob(id) {
  return jobs.get(id);
}

function deleteJob(id) {
  jobs.delete(id);
}

module.exports = { createJob, updateProgress, completeJob, failJob, getJob, deleteJob };
