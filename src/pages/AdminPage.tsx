import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BedSingle, Building2, CheckCircle2, RefreshCw, ShieldAlert, UserPlus } from 'lucide-react';
import {
  createBed,
  createRoom,
  createUser,
  fetchAdminRooms,
  type AdminRole,
  type AdminRoom,
  type CreateBedPayload,
  type CreateRoomPayload,
  type CreateUserPayload,
} from '../api/adminApi';
import { useAuth } from '../auth/useAuth';

type Tab = 'users' | 'rooms' | 'beds';
type Notice = { tone: 'success' | 'error'; text: string } | null;

const initialUser: CreateUserPayload = {
  username: '',
  password: '',
  displayName: '',
  role: 'STAFF',
};

const initialRoom: CreateRoomPayload = {
  roomId: '',
  label: '',
  cameraId: '',
  gender: '공용',
  capacity: 4,
};

const initialBed: CreateBedPayload = {
  bedId: '',
  roomId: '',
  patientName: '',
  patientNo: '',
};

export function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const [userForm, setUserForm] = useState<CreateUserPayload>(initialUser);
  const [roomForm, setRoomForm] = useState<CreateRoomPayload>(initialRoom);
  const [bedForm, setBedForm] = useState<CreateBedPayload>(initialBed);

  const roomOptions = useMemo(() => rooms.filter((room) => room.roomId), [rooms]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    const data = await fetchAdminRooms();
    setRooms(data);
    setLoadingRooms(false);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  if (user?.role !== 'ADMIN') {
    return (
      <>
        <header className="dashboard-header">
          <div>
            <h1>관리</h1>
            <span className="timestamp">관리자 권한이 필요한 메뉴입니다.</span>
          </div>
        </header>
        <article className="panel admin-empty">
          <ShieldAlert size={24} />
          <strong>접근 권한 없음</strong>
          <p>사용자 등록과 병실 생성은 관리자 계정으로 로그인한 경우에만 사용할 수 있습니다.</p>
        </article>
      </>
    );
  }

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSubmitting(true);
    const res = await createUser(userForm);
    setSubmitting(false);

    if (!res.ok) {
      setNotice({ tone: 'error', text: res.message ?? '사용자 등록에 실패했습니다.' });
      return;
    }

    setUserForm(initialUser);
    setNotice({ tone: 'success', text: '사용자를 등록했습니다.' });
  };

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSubmitting(true);
    const res = await createRoom(roomForm);
    setSubmitting(false);

    if (!res.ok) {
      setNotice({ tone: 'error', text: res.message ?? '병실 생성에 실패했습니다.' });
      return;
    }

    setRoomForm(initialRoom);
    setNotice({ tone: 'success', text: '병실을 생성했습니다.' });
    await loadRooms();
  };

  const handleCreateBed = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setSubmitting(true);
    const res = await createBed(bedForm);
    setSubmitting(false);

    if (!res.ok) {
      setNotice({ tone: 'error', text: res.message ?? '병상 생성에 실패했습니다.' });
      return;
    }

    setBedForm({ ...initialBed, roomId: bedForm.roomId });
    setNotice({ tone: 'success', text: '병상을 생성했습니다.' });
    await loadRooms();
  };

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1>운영 관리</h1>
          <span className="timestamp">사용자 계정과 병실/병상 정보를 등록합니다.</span>
        </div>
        <div className="header-actions">
          <button className="toggle" type="button" onClick={loadRooms} disabled={loadingRooms}>
            <RefreshCw size={15} className={loadingRooms ? 'spin' : ''} />동기화
          </button>
        </div>
      </header>

      <div className="admin-tabs" role="tablist" aria-label="관리 메뉴">
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          <UserPlus size={15} />사용자 등록
        </button>
        <button className={tab === 'rooms' ? 'active' : ''} onClick={() => setTab('rooms')}>
          <Building2 size={15} />병실 생성
        </button>
        <button className={tab === 'beds' ? 'active' : ''} onClick={() => setTab('beds')}>
          <BedSingle size={15} />병상 생성
        </button>
      </div>

      {notice && (
        <div className={`admin-notice ${notice.tone}`}>
          {notice.tone === 'success' ? <CheckCircle2 size={15} /> : <ShieldAlert size={15} />}
          <span>{notice.text}</span>
        </div>
      )}

      <section className="admin-layout">
        <article className="panel admin-form-panel">
          {tab === 'users' && (
            <form onSubmit={handleCreateUser}>
              <div className="panel-header">
                <div className="panel-header-left">
                  <UserPlus size={16} />
                  <h2>사용자 등록</h2>
                </div>
              </div>
              <div className="admin-form-grid">
                <div className="form-field">
                  <label htmlFor="new-username">아이디</label>
                  <input id="new-username" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label htmlFor="new-display-name">표시 이름</label>
                  <input id="new-display-name" value={userForm.displayName} onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label htmlFor="new-password">초기 비밀번호</label>
                  <input id="new-password" type="password" minLength={8} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label htmlFor="new-role">권한</label>
                  <select id="new-role" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as AdminRole })}>
                    <option value="STAFF">직원</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                </div>
              </div>
              <button className="login-btn admin-submit" type="submit" disabled={submitting}>
                {submitting ? '등록 중...' : '사용자 등록'}
              </button>
            </form>
          )}

          {tab === 'rooms' && (
            <form onSubmit={handleCreateRoom}>
              <div className="panel-header">
                <div className="panel-header-left">
                  <Building2 size={16} />
                  <h2>병실 생성</h2>
                </div>
              </div>
              <div className="admin-form-grid">
                <div className="form-field">
                  <label htmlFor="room-id">병실 ID</label>
                  <input id="room-id" value={roomForm.roomId} onChange={(e) => setRoomForm({ ...roomForm, roomId: e.target.value })} placeholder="301호" required />
                </div>
                <div className="form-field">
                  <label htmlFor="room-label">병실명</label>
                  <input id="room-label" value={roomForm.label} onChange={(e) => setRoomForm({ ...roomForm, label: e.target.value })} placeholder="301호 병실" required />
                </div>
                <div className="form-field">
                  <label htmlFor="room-camera">카메라 ID</label>
                  <input id="room-camera" value={roomForm.cameraId} onChange={(e) => setRoomForm({ ...roomForm, cameraId: e.target.value })} placeholder="CAM-06" required />
                </div>
                <div className="form-field">
                  <label htmlFor="room-gender">구분</label>
                  <select id="room-gender" value={roomForm.gender} onChange={(e) => setRoomForm({ ...roomForm, gender: e.target.value })}>
                    <option value="공용">공용</option>
                    <option value="남자">남자</option>
                    <option value="여자">여자</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="room-capacity">정원</label>
                  <input id="room-capacity" type="number" min={1} max={12} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} required />
                </div>
              </div>
              <button className="login-btn admin-submit" type="submit" disabled={submitting}>
                {submitting ? '생성 중...' : '병실 생성'}
              </button>
            </form>
          )}

          {tab === 'beds' && (
            <form onSubmit={handleCreateBed}>
              <div className="panel-header">
                <div className="panel-header-left">
                  <BedSingle size={16} />
                  <h2>병상 생성</h2>
                </div>
              </div>
              <div className="admin-form-grid">
                <div className="form-field">
                  <label htmlFor="bed-room">병실</label>
                  <select id="bed-room" value={bedForm.roomId} onChange={(e) => setBedForm({ ...bedForm, roomId: e.target.value })} required>
                    <option value="">병실 선택</option>
                    {roomOptions.map((room) => (
                      <option key={room.roomId} value={room.roomId}>{room.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="bed-id">병상 ID</label>
                  <input id="bed-id" value={bedForm.bedId} onChange={(e) => setBedForm({ ...bedForm, bedId: e.target.value })} placeholder="B-301" required />
                </div>
                <div className="form-field">
                  <label htmlFor="patient-name">환자명</label>
                  <input id="patient-name" value={bedForm.patientName} onChange={(e) => setBedForm({ ...bedForm, patientName: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label htmlFor="patient-no">관리번호</label>
                  <input id="patient-no" value={bedForm.patientNo} onChange={(e) => setBedForm({ ...bedForm, patientNo: e.target.value })} placeholder="24-3011" required />
                </div>
              </div>
              <button className="login-btn admin-submit" type="submit" disabled={submitting}>
                {submitting ? '생성 중...' : '병상 생성'}
              </button>
            </form>
          )}
        </article>

        <aside className="panel admin-summary-panel">
          <div className="panel-header">
            <h2>병실 현황</h2>
            <span className="admin-count">{rooms.length}</span>
          </div>
          <div className="admin-room-list">
            {rooms.map((room) => (
              <div className="admin-room-item" key={room.roomId}>
                <div>
                  <strong>{room.label}</strong>
                  <span>{room.roomId} · {room.cameraId || '카메라 미등록'}</span>
                </div>
                <em>{room.bedIds?.length ?? 0}/{room.capacity}</em>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </>
  );
}
