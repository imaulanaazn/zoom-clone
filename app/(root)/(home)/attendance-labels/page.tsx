'use client';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { toast } from 'react-toastify';
import { apiClient } from '@/lib/utils';
import MeetingModal from '@/components/MeetingModal';
import { ILabel, ILabelGroup } from '@/interface';

export default function Attendance() {
  const [descriptor, setDescriptor] = useState<number[]>([]);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageGroupRef = useRef<HTMLImageElement | null>(null);
  const fileRef = useRef(null);
  const fileGroupRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageGroupPreview, setImageGroupPreview] = useState('');
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [labels, setLabels] = useState<ILabel[]>([]);
  const [labelGroups, setLabelGroups] = useState<ILabelGroup[]>([]);
  const [search, setSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [updateLabelFormVal, setUpdateLabelFormVal] = useState<ILabel | null>(
    null,
  );
  const [updateGroupFormVal, setUpdateGroupFormVal] =
    useState<ILabelGroup | null>(null);
  const [showModal, setShowModal] = useState('');

  const toggleLabels = (id: number) => {
    setSelectedLabels((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id],
    );
  };

  const handleFileChange = async (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const imgURL = URL.createObjectURL(file);
      if (imageRef.current) {
        imageRef.current.src = imgURL;
      }

      setImagePreview(imgURL);
      const toastId = toast.loading('Mengekstraksi fitur wajah');
      const detections = await faceapi
        .detectSingleFace(
          imageRef.current as faceapi.TNetInput,
          new faceapi.MtcnnOptions(),
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        toast.update(toastId, {
          type: 'success',
          isLoading: false,
          autoClose: 2000,
          render: 'Fitur wajah berhasil diekstraksi',
        });
        setDescriptor(Array.from(detections.descriptor));
      } else {
        console.error('Tidak terdeteksi wajah pada gambar yang dimasukkan');
      }

      fileRef.current = file;
    }
  };

  const handleGroupFileChange = async (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const imgURL = URL.createObjectURL(file);
      if (imageGroupRef.current) {
        imageGroupRef.current.src = imgURL;
      }

      setImageGroupPreview(imgURL);
      fileGroupRef.current = file;
    }
  };

  async function createLabel() {
    if (!fileRef.current || !name) {
      toast.error('Please upload an image and enter a name.');
      return;
    }

    if (!descriptor.length) {
      toast.error('Pastikan terdapat wajah dalam gambar');
      return;
    }

    const userData = getUserData();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('descriptor', JSON.stringify(descriptor));
    formData.append('owner_id', userData.account_id);
    formData.append('image', fileRef.current);
    const toastId = toast.loading('Menambahkan label baru');
    try {
      const response = await apiClient.post(
        '/api/v1/users/me/labels',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const data = response.data;
      if (data.id) {
        toast.update(toastId, {
          type: 'success',
          render: 'Label baru berhasil ditambahkan',
          isLoading: false,
          autoClose: 3000,
        });
        setDescriptor([]);
        setImagePreview('');
        setName('');
      }
    } catch (error) {
      toast.update(toastId, {
        type: 'error',
        isLoading: false,
        render: 'Gagal menambahkan label baru',
        autoClose: 3000,
      });
      console.error('Gagal menambahkan label baru:', error);
      throw error;
    }
  }

  async function updateLabel() {
    const userData = getUserData();
    if (!userData) {
      return;
    }

    if (!name) {
      toast.error('Pastikan nama label terisi');
      return;
    }

    const toastId = toast.loading('Mengubah data');

    try {
      const response = await apiClient.put(
        `/api/v1/users/me/labels/${updateLabelFormVal?.id}`,
        { name },
      );

      if (response.data) {
        toast.update(toastId, {
          type: 'success',
          render: 'Berhasil mengubah label',
          isLoading: false,
          autoClose: 3000,
        });
        setUpdateLabelFormVal(null);
        setName('');
      }
    } catch (error) {
      toast.update(toastId, {
        type: 'error',
        render: 'Gagal mengubah label',
        isLoading: false,
        autoClose: 3000,
      });
      console.error('Gagal mengubah baru:', error);
    }
  }

  async function deleteLabel(id: number) {
    const userData = getUserData();
    if (!userData) {
      return;
    }

    const toastId = toast.loading('Menghapus data');

    try {
      const response = await apiClient.delete(`/api/v1/users/me/labels/${id}`);

      if (response.data) {
        toast.update(toastId, {
          type: 'success',
          render: 'Berhasil menghapus label',
          isLoading: false,
          autoClose: 3000,
        });
        getLabels('');
      }
    } catch (error) {
      toast.update(toastId, {
        type: 'error',
        render: 'Gagal menghapus label',
        isLoading: false,
        autoClose: 3000,
      });
      console.error('Gagal menghapus baru:', error);
    }
  }

  async function deleteGroup(id: number) {
    const userData = getUserData();
    if (!userData) {
      return;
    }

    const toastId = toast.loading('Menghapus data');

    try {
      const response = await apiClient.delete(
        `/api/v1/users/me/label-groups/${id}`,
      );

      if (response.data) {
        toast.update(toastId, {
          type: 'success',
          render: 'Berhasil menghapus group label',
          isLoading: false,
          autoClose: 3000,
        });
        getLabelGroups('');
      }
    } catch (error) {
      toast.update(toastId, {
        type: 'error',
        render: 'Gagal menghapus group label',
        isLoading: false,
        autoClose: 3000,
      });
      console.error('Gagal menghapus group baru:', error);
    }
  }

  async function getLabels(query: string) {
    const userData = JSON.parse(localStorage.getItem('user_details') || '{}');

    if (!userData.account_id) {
      toast.error("Couldn't find your account. Please authorize yourself");
      return;
    }

    try {
      const response = await apiClient.get(
        `/api/v1/users/me/labels?owner_id=${userData.account_id}${query}`,
      );

      const data = response.data;
      setLabels(data);
    } catch (error) {
      console.error('Error uploading new attendance:', error);
      throw error;
    }
  }

  async function getLabelGroups(query: string) {
    const userData = JSON.parse(localStorage.getItem('user_details') || '{}');

    if (!userData.account_id) {
      toast.error("Couldn't find your account. Please authorize yourself");
      return;
    }

    try {
      const response = await apiClient.get(
        `/api/v1/users/me/label-groups?owner_id=${userData.account_id}${query}`,
      );

      const data = response.data;
      if (data.length) {
        setLabelGroups(data);
      }
    } catch (error) {
      console.error('Error uploading new attendance:', error);
      throw error;
    }
  }

  async function updateLabelGroup() {
    const userData = getUserData();

    if (
      !groupName ||
      !Array.isArray(selectedLabels) ||
      selectedLabels.length === 0
    ) {
      toast.error('Pastikan nama dan anggota label terisi');
      return;
    }

    const formData = new FormData();
    formData.append('name', groupName);
    formData.append('labels', JSON.stringify(selectedLabels));
    formData.append('owner_id', userData.account_id);
    const toastId = toast.loading('Mengubah data');

    console.log(typeof fileGroupRef.current);

    try {
      if (
        fileGroupRef.current?.type === 'image/jpeg' ||
        fileGroupRef.current?.type === 'image/jpg' ||
        fileGroupRef.current?.type === 'image/png'
      ) {
        formData.append('image', fileGroupRef.current as unknown as File);
      } else {
        try {
          formData.append('image', updateGroupFormVal?.image || '');
        } catch (error) {
          console.error('Error fetching image:', error);
          toast.error('Gagal mengunggah gambar.');
          return;
        }
      }

      const response = await apiClient.put(
        `/api/v1/users/me/label-groups/${updateGroupFormVal?.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data) {
        toast.update(toastId, {
          type: 'success',
          render: 'Berhasil mengubah grup label',
          isLoading: false,
          autoClose: 3000,
        });
        getLabelGroups('');
        setImageGroupPreview('');
        setGroupName('');
        setSelectedLabels([]);
      }
    } catch (error) {
      toast.update(toastId, {
        type: 'error',
        render: 'Gagal mengubah grup label',
        isLoading: false,
        autoClose: 3000,
      });
      console.error('Gagal mengubah grup baru:', error);
    }
  }

  async function createLabelGroup() {
    const userData = getUserData();

    if (
      !groupName ||
      !Array.isArray(selectedLabels) ||
      selectedLabels.length === 0
    ) {
      toast.error('Pastikan nama dan anggota label terisi');
      return;
    }

    const formData = new FormData();
    formData.append('name', groupName);
    formData.append('labels', JSON.stringify(selectedLabels));
    formData.append('owner_id', userData.account_id);
    if (
      fileGroupRef.current?.type === 'image/jpeg' ||
      fileGroupRef.current?.type === 'image/jpg' ||
      fileGroupRef.current?.type === 'image/png'
    ) {
      formData.append('image', fileGroupRef.current as unknown as File);
    }
    const toastId = toast.loading('Uploading data');

    try {
      const response = await apiClient.post(
        '/api/v1/users/me/label-groups',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data) {
        toast.update(toastId, {
          type: 'success',
          render: 'Berhasil membuat grup label baru',
          isLoading: false,
          autoClose: 3000,
        });
        getLabelGroups('');
        setImageGroupPreview('');
        setGroupName('');
        setSelectedLabels([]);
      }
    } catch (error) {
      toast.update(toastId, {
        type: 'error',
        render: 'Gagal membuat grup label baru',
        isLoading: false,
        autoClose: 3000,
      });
      console.error('Gagal membuat grup baru:', error);
    }
  }

  function getUserData() {
    const userData = JSON.parse(localStorage.getItem('user_details') || '{}');

    if (!userData.account_id) {
      toast.error("Couldn't find your account. Please authorize yourself");
      return null;
    } else {
      return userData;
    }
  }

  function handleLabelSearch() {
    getLabels(search ? `&name=${search}` : '');
  }

  function handleGroupSearch() {
    getLabelGroups(groupSearch ? `&name=${groupSearch}` : '');
  }

  function showUpdateGroupForm(group: ILabelGroup) {
    setShowModal('update-group-modal');
    setUpdateGroupFormVal(group);
    if (group) {
      setImageGroupPreview(`http://localhost:4000/uploads/${group.image}`);
      setGroupName(group.name);
      setSelectedLabels(group.members);
    }
  }

  function showUpdateLabelForm(label: ILabel) {
    setShowModal('update-label-modal');
    setUpdateLabelFormVal(label);
    if (label) {
      setImagePreview(`http://localhost:4000/uploads/${label.image}`);
      setName(label.name);
    }
  }

  useEffect(() => {
    getLabels('');
    getLabelGroups('');
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.mtcnn.loadFromUri('/models/mtcnn');
      await faceapi.nets.faceLandmark68Net.loadFromUri(
        '/models/face_landmark_68',
      );
      await faceapi.nets.faceRecognitionNet.loadFromUri(
        '/models/face_recognition',
      );
    };
    toast.promise(loadModels(), {
      pending: 'Memuat Model',
      success: 'Model Dimuat',
      error: 'Gagal Memuat Model',
    });

    loadModels();
  }, []);

  return (
    <>
      <div className="rounded-xl bg-dark-1 p-6 text-white/90">
        <div className="flex items-center justify-between">
          <h3>Daftar Label</h3>
          <div className="flex items-center gap-6">
            <button
              className="rounded-md bg-blue-600 px-3 py-1.5"
              onClick={() => {
                setShowModal('create-label-modal');
              }}
            >
              Buat Label
            </button>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                className="rounded-md border border-white/90 bg-transparent px-2 py-1"
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
              />
              <button
                className="rounded-md bg-blue-600 px-3 py-1 text-white"
                onClick={handleLabelSearch}
              >
                Cari
              </button>
            </div>
          </div>
        </div>
        <table className="mt-4 w-full table-auto">
          <thead className="border-b">
            <tr className="bg-gray-700">
              <th className="p-4 text-left font-medium">Id</th>
              <th className="p-4 text-left font-medium">Nama</th>
              <th className="p-4 text-left font-medium">Foto</th>
              <th className="p-4 text-left font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((attendance) => (
              <tr key={attendance.id} className="border-b hover:bg-gray-800">
                <td className="p-4">{attendance.id}</td>
                <td className="p-4">{attendance.name}</td>
                <td className="p-2">
                  <Image
                    src={`http://localhost:4000/uploads/${attendance.image}`}
                    width={100}
                    height={100}
                    alt="user profile"
                    className="aspect-square h-auto w-12 object-cover"
                  />
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <button
                      className="rounded-md bg-blue-600 px-4 py-1.5"
                      onClick={() => showUpdateLabelForm(attendance)}
                    >
                      Ubah
                    </button>
                    <button
                      className="rounded-md bg-rose-600 px-4 py-1.5"
                      onClick={() => deleteLabel(attendance.id)}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!labels.length && <p className="mt-8 text-center">Tidak ada data</p>}
      </div>

      <div className="mt-6 rounded-xl bg-dark-1 p-6 text-white/90">
        <div className="flex items-center justify-between">
          <h3>Daftar Grup Label</h3>
          <div className="flex items-center gap-6">
            <button
              className="rounded-md bg-blue-600 px-3 py-1.5"
              onClick={() => {
                setShowModal('create-group-modal');
                getLabels('');
              }}
            >
              Buat Grup
            </button>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={groupSearch}
                className="rounded-md border border-white/80 bg-transparent px-2 py-1"
                onChange={(e) => {
                  setGroupSearch(e.target.value);
                }}
              />
              <button
                className="rounded-md bg-blue-600 px-3 py-1 text-white"
                onClick={handleGroupSearch}
              >
                Cari
              </button>
            </div>
          </div>
        </div>
        <table className="mt-4 w-full table-auto">
          <thead className="border-b">
            <tr className="bg-gray-700">
              <th className="p-4 text-left font-medium">Id</th>
              <th className="p-4 text-left font-medium">Name</th>
              <th className="p-4 text-left font-medium">Image</th>
              <th className="p-4 text-left font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {labelGroups.map((group) => (
              <tr key={group.id} className="border-b hover:bg-gray-800">
                <td className="p-4">{group.id}</td>
                <td className="p-4">{group.name}</td>
                <td className="p-2">
                  <Image
                    src={`http://localhost:4000/uploads/${group.image}`}
                    width={100}
                    height={100}
                    alt="group profile"
                    className="aspect-square h-auto w-12 object-cover"
                  />
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <button
                      className="rounded-md bg-blue-600 px-4 py-1.5"
                      onClick={() => showUpdateGroupForm(group)}
                    >
                      Ubah
                    </button>
                    <button
                      className="rounded-md bg-rose-600 px-4 py-1.5"
                      onClick={() => deleteGroup(group.id)}
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!labels.length && <p className="mt-8 text-center">Tidak ada data</p>}
      </div>

      {(showModal === 'create-label-modal' ||
        showModal === 'update-label-modal') && (
        <MeetingModal
          isOpen={true}
          onClose={() => {
            setShowModal('');
          }}
          title={
            showModal === 'create-label-modal'
              ? 'Buat Label Baru'
              : 'Update Label'
          }
          className="text-center"
          buttonText={
            showModal === 'create-label-modal' ? 'Buat Label' : 'Perbarui label'
          }
          handleClick={
            showModal === 'create-label-modal' ? createLabel : updateLabel
          }
        >
          <div className="relative mx-auto aspect-square h-auto w-40 rounded-lg border-2 border-dashed border-white/90 bg-[url('/icons/add-personal.svg')] bg-center bg-no-repeat hover:cursor-pointer hover:brightness-50">
            <Image
              src={imagePreview}
              width={200}
              height={200}
              alt={''}
              ref={imageRef}
              className={`aspect-square h-auto w-full object-cover object-center ${imagePreview ? 'opacity-100' : 'opacity-0'}`}
            />
            <input
              type="file"
              className="absolute left-0 top-0 aspect-square h-auto w-40 opacity-0 hover:cursor-pointer"
              accept="image/*"
              ref={fileRef}
              disabled={showModal === 'update-label-modal'}
              onChange={handleFileChange}
            />
          </div>
          {showModal === 'create-label-modal' && (
            <p className="text-center text-sm font-normal text-orange-400">
              *pastikan terdapat wajah pada gambar
            </p>
          )}
          <div className="mt-3 flex flex-col gap-0.5 text-white/90">
            <label htmlFor="nama">Nama :</label>
            <input
              id="nama"
              type="text"
              value={name}
              className="w-full rounded-md border border-white/90 bg-transparent px-2 py-1"
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>
        </MeetingModal>
      )}

      {(showModal === 'create-group-modal' ||
        showModal === 'update-group-modal') && (
        <MeetingModal
          isOpen={true}
          onClose={() => {
            setShowModal('');
            setSelectedLabels([]);
          }}
          title={
            showModal === 'create-group-modal' ? 'Buat Grup Baru' : 'Ubah Group'
          }
          className="text-center"
          buttonText={
            showModal === 'create-group-modal' ? 'Buat Grup' : 'Ubah Group'
          }
          handleClick={() => {
            showModal === 'create-group-modal'
              ? createLabelGroup()
              : updateLabelGroup();
          }}
        >
          <div className="h-[68vh] overflow-y-auto">
            <div className="relative mx-auto mb-4 aspect-square h-auto w-20 rounded-lg border-2 border-dashed border-white/90 bg-[url('/icons/add-personal.svg')] bg-center bg-no-repeat hover:brightness-50">
              <Image
                src={imageGroupPreview}
                width={200}
                height={200}
                alt={''}
                ref={imageGroupRef}
                className={`aspect-square h-auto w-20 object-cover object-center ${imageGroupPreview ? 'opacity-100' : 'opacity-0'}`}
              />
              <input
                type="file"
                className="absolute left-0 top-0  aspect-square h-auto w-20 opacity-0 hover:cursor-pointer"
                accept="image/*"
                ref={fileGroupRef}
                onChange={handleGroupFileChange}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="group-name">Nama Grup :</label>
              <input
                type="text"
                value={groupName}
                className="flex-1 rounded-md border border-slate-600 bg-slate-800 px-2 py-1"
                onChange={(e) => {
                  setGroupName(e.target.value);
                }}
              />
            </div>
            <div className="mt-4 flex flex-col">
              <label htmlFor="group-members">Anggota grup :</label>
              <div className="flex items-center gap-2">
                <input
                  id="group-search"
                  type="text"
                  value={search}
                  className="flex-1 rounded-md border border-slate-600 bg-slate-800 px-2 py-1"
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                />
                <button
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-white"
                  onClick={handleLabelSearch}
                >
                  Cari Label
                </button>
              </div>
            </div>
            <div className="mt-2">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className={`my-2 flex items-center gap-2 rounded-md p-2 hover:cursor-pointer ${
                    selectedLabels.includes(label.id)
                      ? 'bg-emerald-800'
                      : 'bg-slate-800'
                  }`}
                  onClick={() => toggleLabels(label.id)}
                >
                  <Image
                    width={50}
                    height={50}
                    src={`http://localhost:4000/uploads/${label.image}`}
                    alt="person profile"
                    className="aspect-square h-auto w-10 rounded-md object-cover"
                  />
                  <p className="m-0">{label.name}</p>
                </div>
              ))}
            </div>
          </div>
        </MeetingModal>
      )}
    </>
  );
}
