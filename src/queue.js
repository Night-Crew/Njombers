let instances = new WeakMap();
function set(key, data) {
  if (instances.has(key)) {
    let original = instances.get(key);
    for (let key in data) original[key] = data[key];
  } else {
    instances.set(key, data);
  }
}

function get(key) {
  return instances.get(key);
}

const State = {
  IDLE: 0,
  STARTED: 1,
};

export class Queue {
  constructor() {
    set(this, { jobs: [], state: State.IDLE });
  }

  get length() {
    return get(this).jobs.length;
  }

  async start() {
    let { state, jobs } = get(this);
    if (state === State.STARTED || jobs.length <= 0) return;

    set(this, { state: State.STARTED });

    while (jobs.length > 0) {
      let job = jobs.shift();

      // Handle the job
      let settled = Promise.resolve().then(job.handle);

      // Resolve / reject the job promise wrapper
      await settled.then(job.resolve, job.reject);
    }

    set(this, { state: State.IDLE });
  }

  push(handle) {
    return new Promise((resolve, reject) => {
      let { jobs } = get(this);
      jobs.push({ handle, resolve, reject });
      setImmediate(() => this.start());
    });
  }
}
