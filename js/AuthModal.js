function AuthModal({onSignedIn, onClose}){
  const [tab,setTab] = useState('signin'); // 'signin' | 'signup'
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [confirm,setConfirm] = useState('');
  const [error,setError] = useState('');
  const [info,setInfo] = useState('');
  const [busy,setBusy] = useState(false);

  const usingLocalAuth = !supabaseReady;

  function getLocalUsers(){
    try{
      return JSON.parse(localStorage.getItem('lu-local-users') || '[]');
    }catch{
      return [];
    }
  }

  function saveLocalUsers(users){
    localStorage.setItem('lu-local-users', JSON.stringify(users));
  }

  async function submit(e){
    e.preventDefault();
    setError(''); setInfo('');

    const trimmedEmail = email.trim();
    if(!trimmedEmail || !password){ setError('Enter an email and password.'); return; }
    if(tab==='signup' && password !== confirm){ setError("Passwords don't match."); return; }
    if(tab==='signup' && password.length<6){ setError('Password should be at least 6 characters.'); return; }

    setBusy(true);
    try{
      if(usingLocalAuth){
        const users = getLocalUsers();

        if(tab==='signin'){
          const user = users.find(u => u.email.toLowerCase() === trimmedEmail.toLowerCase() && u.password === password);
          if(!user) throw new Error('No local account found for that email/password. Create an account first.');
          onSignedIn({email: user.email});
          return;
        }

        const alreadyExists = users.some(u => u.email.toLowerCase() === trimmedEmail.toLowerCase());
        if(alreadyExists){
          setInfo('A local account already exists for this email. You can sign in with it now.');
          setTab('signin');
          setPassword('');
          setConfirm('');
          return;
        }

        users.push({email: trimmedEmail, password});
        saveLocalUsers(users);
        setInfo('Local account created successfully. You can sign in now.');
        setTab('signin');
        setPassword('');
        setConfirm('');
        return;
      }

      if(tab==='signin'){
        const {data, error: err} = await supabaseClient.auth.signInWithPassword({email:trimmedEmail, password});
        if(err) throw err;
        onSignedIn(data.user);
      }else{
        const {data, error: err} = await supabaseClient.auth.signUp({email:trimmedEmail, password});
        if(err) throw err;
        if(data.session){ onSignedIn(data.user); }
        else { setInfo('Account created — check your email to confirm before signing in.'); }
      }
    }catch(err){
      setError(err.message || 'Something went wrong.');
    }finally{
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="login-card" onClick={e=>e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <h1 className="login-title">{tab==='signin' ? 'Sign in' : 'Create account'}</h1>
        <p className="login-sub">
          {usingLocalAuth
            ? 'Supabase isn\'t available in this environment, so this is using a local demo account flow.'
            : 'Real account, backed by Supabase — your password is never stored here.'}
        </p>

        <div className="login-mode-toggle">
          <button type="button" className={tab==='signin'?'active':''} onClick={()=>{setTab('signin');setError('');setInfo('');}}>Sign in</button>
          <button type="button" className={tab==='signup'?'active':''} onClick={()=>{setTab('signup');setError('');setInfo('');}}>Sign up</button>
        </div>

        <label className="login-label">Email address</label>
        <input className="login-input" type="email" placeholder="you@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} />

        <label className="login-label">Password</label>
        <input className="login-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />

        {tab==='signup' && (
          <>
            <label className="login-label">Confirm password</label>
            <input className="login-input" type="password" placeholder="••••••••" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          </>
        )}

        {usingLocalAuth && (
          <p className="login-hint">Tip: create a local account once, then use the same email/password to sign in next time.</p>
        )}

        {error && <p className="login-error">{error}</p>}
        {info && <p className="login-hint">{info}</p>}

        <button type="submit" className="login-submit" disabled={busy}>
          {busy ? 'Please wait…' : (tab==='signin' ? 'Sign in' : 'Create account')}
        </button>
      </form>
    </div>
  );
}

