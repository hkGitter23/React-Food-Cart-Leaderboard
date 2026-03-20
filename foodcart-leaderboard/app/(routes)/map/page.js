'use client'

import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {APIProvider, Map, Marker} from '@vis.gl/react-google-maps'
import {collection, getDocs} from 'firebase/firestore'
import {db} from '@/lib/firebase'

import styles from './page.module.css'

const DEFAULT_CENTER = {lat: 39.9567278072105, lng: -75.18994410333964}

export default function MapPage() {
	const [trucks, setTrucks] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [selectedTruck, setSelectedTruck] = useState(null)
	const [activeTab, setActiveTab] = useState('about')

	useEffect(() => {
		const fetchTrucks = async () => {
			try {
				const snapshot = await getDocs(collection(db, 'Foodcarts'))
				const results = []
				snapshot.forEach((docSnap) => {
					const data = docSnap.data()
					const lat = data.lat
					const lng = data.lng
					if (typeof lat !== 'number' || typeof lng !== 'number') {
						console.error("Invalid latitude or longitude", data.lat, data.lng)
						return
					}

					results.push({
						id: docSnap.id,
						name: data.name ?? docSnap.id,
						address: data.address ?? data.Address ?? 'Address unavailable',
						rating: data.rating ?? data.Rating ?? null,
						menu: data.menu ?? data.Menu ?? {},
						about: data.about ?? data.About ?? '',
						position: {lat, lng},
					})
				})
				setTrucks(results)
			} catch (err) {
				console.error('Failed to load food carts', err)
				setError('Unable to load food carts right now.')
			} finally {
				setLoading(false)
			}
		}

		fetchTrucks()
	}, [])

	const menuItems = useMemo(() => {
		if (!selectedTruck?.menu) return []
		if (Array.isArray(selectedTruck.menu)) {
			return selectedTruck.menu.map((item) => typeof item === "string" ? item : item.price ? `${item.name}: ${item.price}` : item.name)
		}
		return Object.entries(selectedTruck.menu).map(([item, price]) => {
			if (price === null || price === undefined || price === '') {
				return item
			}
			return `${item}: ${price}`
		})
	}, [selectedTruck])

	const handleMarkerClick = useCallback((truck) => {
		setSelectedTruck(truck)
		setActiveTab('about')
	}, [])

	return (
		<div>
			<div className={styles.container}>
				<APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}>
					<Map
						className={styles.map}
						defaultCenter={DEFAULT_CENTER}
						defaultZoom={16}
						gestureHandling='greedy'
						onLoad={() => console.log('Map loaded')}
						onUnmount={() => console.log('Map unmounted')}
						styles={[
							{
								featureType: 'poi',
								elementType: 'labels',
								stylers: [{ visibility: 'off' }]
							},
							{
								featureType: 'poi',
								stylers: [{ visibility: 'off' }]
							}
						]}
					>
						{trucks.map((truck) => (
							<Marker
								key={truck.id}
								position={truck.position}
								title={truck.name}
								onClick={() => handleMarkerClick(truck)}
							/>
						))}
					</Map>
				</APIProvider>

				{selectedTruck && (
					<div className={styles.infoPanel}>
						<button
							onClick={() => setSelectedTruck(null)}
							className={styles.closeButton}
							aria-label='Close panel'
						>X</button>
						<h2 className={styles.panelTitle}>{selectedTruck.name}</h2>
						<div className={styles.panelAddress}>{selectedTruck.address}</div>
						{selectedTruck.rating && (
							<div className={styles.panelRating}>Rating: {selectedTruck.rating.toFixed(1)}</div>
						)}

						<div className={styles.tabList}>
							{['about', 'menu'].map((tab) => (
								<button
									key={tab}
									onClick={() => setActiveTab(tab)}
									className={`${styles.tabButton} ${activeTab === tab ? styles.tabButtonActive : ''}`}
								>
									{tab}
								</button>
							))}
						</div>

						<div className={styles.tabContent}>
							{activeTab === 'about' ? (
								<p className={styles.aboutText}>{selectedTruck.about || 'No description available yet.'}</p>
							) : menuItems.length ? (
								<ul className={styles.menuList}>
									{menuItems.map((item, idx) => (
										<li key={`${item}-${idx}`} className={styles.menuItem}>
											{item}
										</li>
									))}
								</ul>
							) : (
								<p className={styles.placeholderText}>Menu coming soon.</p>
							)}
						</div>
					</div>
				)}

				{loading && (
					<div className={styles.loadingBadge}>
						Loading food trucks…
					</div>
				)}

				{error && (
					<div className={styles.errorToast}>
						{error}
					</div>
				)}
			</div>
		</div>
	)
}
